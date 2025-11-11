const prisma = require('../../lib/prisma');
const openai = require('../../services/openai.service');
const { logger } = require('../../utils/logger');

class PricingService {
  /**
   * Get dynamic pricing suggestions
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @param {string} [params.itemId] - Optional specific item
   * @returns {Promise<Object>}
   */
  async getDynamicPricingSuggestions({ brandId, branchId, itemId }) {
    try {
      // Get pricing context
      const context = await this.getPricingContext({
        brandId,
        branchId,
        itemId,
      });

      // Build pricing prompt
      const prompt = this.buildPricingPrompt(context);

      // Get AI recommendations
      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: `You are a restaurant pricing strategy expert. Analyze demand, inventory, and market conditions to suggest optimal pricing. Always respond with valid JSON.`,
        temperature: 0.6,
        json: true,
      });

      const suggestions = JSON.parse(aiResponse);

      return {
        generatedAt: new Date(),
        context: {
          timeOfDay: context.timeOfDay,
          dayOfWeek: context.dayOfWeek,
        },
        suggestions: suggestions.items || [],
        strategy: suggestions.strategy,
        insights: suggestions.insights || [],
      };
    } catch (error) {
      logger.error('Error generating pricing suggestions:', error);
      throw new Error(
        `Failed to generate pricing suggestions: ${error.message}`
      );
    }
  }

  /**
   * Analyze price elasticity for an item
   * @param {string} itemId
   * @returns {Promise<Object>}
   */
  async analyzePriceElasticity(itemId) {
    try {
      // Get price change history and sales
      const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
        include: {
          variants: true,
        },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Get sales data
      const salesData = await this.getItemSalesHistory(itemId, 90);

      const prompt = `Analyze price elasticity for this menu item:

Item: ${item.defaultName}
Current Price: ${item.variants[0]?.price || 'N/A'}

Sales History (last 90 days):
${salesData
  .slice(0, 30)
  .map(
    (s) =>
      `- ${s.date}: ${s.quantity} sold, avg price $${s.avgPrice}, revenue $${s.revenue}`
  )
  .join('\n')}

Total Sales: ${salesData.reduce((sum, s) => sum + s.quantity, 0)} units
Average Price: $${(salesData.reduce((sum, s) => sum + Number(s.avgPrice), 0) / salesData.length).toFixed(2)}

Return a JSON object with:
{
  "elasticity": "elastic|inelastic|unit_elastic",
  "currentPriceOptimality": "underpriced|optimal|overpriced",
  "recommendedPrice": number,
  "expectedImpact": {
    "sales": "percentage change estimate",
    "revenue": "percentage change estimate"
  },
  "reasoning": "detailed explanation",
  "confidence": "high|medium|low"
}`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt:
          'You are a pricing analytics expert. Analyze sales data to determine price elasticity. Always respond with valid JSON.',
        temperature: 0.5,
        json: true,
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      logger.error('Error analyzing price elasticity:', error);
      throw error;
    }
  }

  /**
   * Get optimal bundle pricing
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string[]} params.itemIds - Items to bundle
   * @returns {Promise<Object>}
   */
  async suggestBundlePricing({ brandId, itemIds }) {
    try {
      // Get item details
      const items = await prisma.menuItem.findMany({
        where: {
          id: { in: itemIds },
          brandId,
        },
        include: {
          variants: true,
        },
      });

      // Analyze items frequently ordered together
      const coOccurrence = await this.analyzeItemCoOccurrence(itemIds);

      const totalPrice = items.reduce((sum, item) => {
        return sum + Number(item.variants[0]?.price || 0);
      }, 0);

      const prompt = `Suggest optimal bundle pricing for these items:

Items:
${items.map((item, idx) => `${idx + 1}. ${item.defaultName} - $${item.variants[0]?.price || '0'}`).join('\n')}

Total Individual Price: $${totalPrice.toFixed(2)}

Co-occurrence Data:
- These items are ordered together ${coOccurrence.frequency}% of the time
- Average order value when together: $${coOccurrence.avgOrderValue}

Return a JSON object with:
{
  "recommendedBundlePrice": number,
  "discount": {
    "amount": number,
    "percentage": number
  },
  "expectedUplift": "percentage increase in bundle purchases",
  "reasoning": "explanation of pricing strategy",
  "marketingAngle": "how to position this bundle"
}`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt:
          'You are a bundle pricing strategist. Suggest prices that maximize revenue while providing value. Always respond with valid JSON.',
        temperature: 0.6,
        json: true,
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      logger.error('Error suggesting bundle pricing:', error);
      throw error;
    }
  }

  /**
   * Get pricing context
   */
  async getPricingContext({ brandId, branchId, itemId }) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    let timeOfDay = 'lunch';
    if (hour < 11) timeOfDay = 'breakfast';
    else if (hour >= 15 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18) timeOfDay = 'dinner';

    // Get current demand
    const recentOrders = await prisma.order.findMany({
      where: {
        brandId,
        branchId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        status: { in: ['PAID', 'SERVED'] },
      },
      include: {
        items: {
          include: { item: true, variant: true },
        },
      },
    });

    // Calculate demand metrics
    const itemSales = {};
    recentOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.itemId;
        if (!itemSales[key]) {
          itemSales[key] = {
            itemId: key,
            itemName: item.item.defaultName,
            quantity: 0,
            revenue: 0,
            avgPrice: 0,
          };
        }
        itemSales[key].quantity += item.quantity;
        itemSales[key].revenue += Number(item.linePrice);
      });
    });

    // Calculate average prices
    Object.values(itemSales).forEach((item) => {
      item.avgPrice = item.revenue / item.quantity;
    });

    // Get inventory levels (low stock = potential price increase)
    const stockLevels = await prisma.stockItem.findMany({
      where: {
        product: { brandId },
      },
      include: {
        product: {
          include: {
            RecipeItem: {
              include: {
                recipe: {
                  include: { item: true },
                },
              },
            },
          },
        },
      },
    });

    return {
      timeOfDay,
      dayOfWeek,
      recentSales: Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 20),
      stockLevels: stockLevels.slice(0, 15),
      itemId,
    };
  }

  /**
   * Build pricing prompt
   */
  buildPricingPrompt(context) {
    let prompt = `Analyze pricing opportunities for ${context.timeOfDay} on ${context.dayOfWeek}.\n\n`;

    prompt += `Recent Sales Performance (last 7 days):\n`;
    context.recentSales.slice(0, 15).forEach((item, idx) => {
      prompt += `${idx + 1}. ${item.itemName}: ${item.quantity} sold, avg $${item.avgPrice.toFixed(2)}\n`;
    });

    prompt += `\nInventory Status:\n`;
    context.stockLevels.forEach((stock, idx) => {
      prompt += `${idx + 1}. ${stock.product.name}: ${stock.quantity} ${stock.product.unit}\n`;
    });

    prompt += `\nReturn a JSON object with:\n`;
    prompt += `{\n`;
    prompt += `  "items": [\n`;
    prompt += `    {\n`;
    prompt += `      "itemName": "name",\n`;
    prompt += `      "currentPrice": number,\n`;
    prompt += `      "suggestedPrice": number,\n`;
    prompt += `      "reason": "explanation",\n`;
    prompt += `      "priority": "high|medium|low"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "strategy": "overall pricing strategy recommendation",\n`;
    prompt += `  "insights": ["market insights"]\n`;
    prompt += `}`;

    return prompt;
  }

  /**
   * Get item sales history
   */
  async getItemSalesHistory(itemId, days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['PAID', 'SERVED'] },
        items: {
          some: { itemId },
        },
      },
      include: {
        items: {
          where: { itemId },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const salesByDay = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = {
          date,
          quantity: 0,
          revenue: 0,
          avgPrice: 0,
        };
      }
      order.items.forEach((item) => {
        salesByDay[date].quantity += item.quantity;
        salesByDay[date].revenue += Number(item.linePrice);
      });
    });

    Object.values(salesByDay).forEach((day) => {
      day.avgPrice = day.revenue / day.quantity;
    });

    return Object.values(salesByDay);
  }

  /**
   * Analyze item co-occurrence
   */
  async analyzeItemCoOccurrence(itemIds) {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'SERVED'] },
        items: {
          some: {
            itemId: { in: itemIds },
          },
        },
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      include: {
        items: true,
      },
    });

    let ordersWithAllItems = 0;
    let totalRevenue = 0;

    orders.forEach((order) => {
      const orderItemIds = order.items.map((i) => i.itemId);
      const hasAll = itemIds.every((id) => orderItemIds.includes(id));
      if (hasAll) {
        ordersWithAllItems++;
        totalRevenue += Number(order.total);
      }
    });

    return {
      frequency: ((ordersWithAllItems / orders.length) * 100).toFixed(1),
      avgOrderValue: ordersWithAllItems
        ? (totalRevenue / ordersWithAllItems).toFixed(2)
        : 0,
      totalOrders: orders.length,
      bundleOrders: ordersWithAllItems,
    };
  }
}

module.exports = new PricingService();
