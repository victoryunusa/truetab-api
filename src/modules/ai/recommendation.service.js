const prisma = require('../../lib/prisma');
const openai = require('../../services/openai.service');
const logger = require('../../utils/logger');

class RecommendationService {
  /**
   * Get personalized menu recommendations for a customer
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @param {string} [params.customerId] - Optional customer ID for personalization
   * @param {string} [params.context] - Optional context (time of day, weather, etc.)
   * @param {number} [params.limit=5] - Number of recommendations
   * @returns {Promise<Array>}
   */
  async getMenuRecommendations({
    brandId,
    branchId,
    customerId,
    context,
    limit = 5,
  }) {
    try {
      // Get popular items
      const popularItems = await this.getPopularItems(brandId, branchId);

      // Get customer order history if available
      let customerHistory = [];
      if (customerId) {
        customerHistory = await this.getCustomerHistory(customerId);
      }

      // Get current time context
      const timeOfDay = this.getTimeOfDay();

      // Build prompt for AI
      const prompt = this.buildRecommendationPrompt({
        popularItems,
        customerHistory,
        timeOfDay,
        context,
        limit,
      });

      // Get AI recommendations
      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: `You are a restaurant recommendation expert. Analyze customer preferences, popular items, and context to provide personalized menu recommendations. Always respond with valid JSON.`,
        temperature: 0.7,
        json: true,
      });

      const recommendations = JSON.parse(aiResponse);

      // Enrich recommendations with full item details
      const enrichedRecommendations = await this.enrichRecommendations(
        recommendations.items || [],
        brandId
      );

      return {
        recommendations: enrichedRecommendations,
        reasoning: recommendations.reasoning || 'Based on popularity and preferences',
      };
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      // Fallback to simple popular items
      return this.getFallbackRecommendations(brandId, branchId, limit);
    }
  }

  /**
   * Get popular items based on order frequency
   */
  async getPopularItems(brandId, branchId, limit = 20) {
    const popularItems = await prisma.orderItem.groupBy({
      by: ['itemId'],
      where: {
        order: {
          brandId,
          branchId,
          status: { in: ['PAID', 'SERVED'] },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        isVoided: false,
      },
      _count: { itemId: true },
      _sum: { quantity: true },
      orderBy: { _count: { itemId: 'desc' } },
      take: limit,
    });

    // Get full item details
    const itemIds = popularItems.map((item) => item.itemId);
    const items = await prisma.menuItem.findMany({
      where: { id: { in: itemIds }, isActive: true },
      include: {
        variants: { where: { isActive: true } },
        categories: { include: { category: true } },
      },
    });

    return items.map((item) => {
      const stats = popularItems.find((p) => p.itemId === item.id);
      return {
        ...item,
        orderCount: stats._count.itemId,
        totalQuantity: stats._sum.quantity,
      };
    });
  }

  /**
   * Get customer order history
   */
  async getCustomerHistory(customerId, limit = 10) {
    const orders = await prisma.order.findMany({
      where: {
        customerId,
        status: { in: ['PAID', 'SERVED'] },
      },
      include: {
        items: {
          include: {
            item: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return orders.map((order) => ({
      orderId: order.id,
      date: order.createdAt,
      items: order.items.map((item) => ({
        name: item.item.defaultName,
        variant: item.variant?.name,
        quantity: item.quantity,
      })),
    }));
  }

  /**
   * Get time of day context
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 18) return 'afternoon';
    return 'dinner';
  }

  /**
   * Build recommendation prompt
   */
  buildRecommendationPrompt({
    popularItems,
    customerHistory,
    timeOfDay,
    context,
    limit,
  }) {
    let prompt = `Generate ${limit} menu item recommendations.\n\n`;

    prompt += `Time of Day: ${timeOfDay}\n`;
    if (context) prompt += `Additional Context: ${context}\n`;

    prompt += `\nPopular Items (last 30 days):\n`;
    popularItems.slice(0, 10).forEach((item, idx) => {
      prompt += `${idx + 1}. ${item.defaultName} - ${item.orderCount} orders\n`;
    });

    if (customerHistory.length > 0) {
      prompt += `\nCustomer Previous Orders:\n`;
      customerHistory.forEach((order, idx) => {
        prompt += `${idx + 1}. ${order.items.map((i) => i.name).join(', ')}\n`;
      });
    }

    prompt += `\nReturn a JSON object with:\n`;
    prompt += `{\n`;
    prompt += `  "items": [{"name": "item name", "reason": "why recommended"}],\n`;
    prompt += `  "reasoning": "overall recommendation strategy"\n`;
    prompt += `}`;

    return prompt;
  }

  /**
   * Enrich recommendations with full item details
   */
  async enrichRecommendations(recommendations, brandId) {
    const itemNames = recommendations.map((r) => r.name);

    const items = await prisma.menuItem.findMany({
      where: {
        brandId,
        defaultName: { in: itemNames, mode: 'insensitive' },
        isActive: true,
      },
      include: {
        variants: { where: { isActive: true } },
        categories: { include: { category: true } },
      },
    });

    return recommendations
      .map((rec) => {
        const item = items.find(
          (i) => i.defaultName.toLowerCase() === rec.name.toLowerCase()
        );
        if (!item) return null;
        return {
          item,
          reason: rec.reason,
        };
      })
      .filter(Boolean);
  }

  /**
   * Fallback recommendations (simple popular items)
   */
  async getFallbackRecommendations(brandId, branchId, limit) {
    const popularItems = await this.getPopularItems(brandId, branchId, limit);
    return {
      recommendations: popularItems.map((item) => ({
        item,
        reason: 'Popular item',
      })),
      reasoning: 'Based on recent popularity',
    };
  }

  /**
   * Get similar items based on a specific item
   */
  async getSimilarItems(itemId, limit = 5) {
    try {
      const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: {
          categories: { include: { category: true } },
        },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Find items in same categories
      const categoryIds = item.categories.map((c) => c.categoryId);

      const similarItems = await prisma.menuItem.findMany({
        where: {
          brandId: item.brandId,
          id: { not: itemId },
          isActive: true,
          categories: {
            some: {
              categoryId: { in: categoryIds },
            },
          },
        },
        include: {
          variants: { where: { isActive: true } },
          categories: { include: { category: true } },
        },
        take: limit,
      });

      return similarItems;
    } catch (error) {
      logger.error('Error getting similar items:', error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
