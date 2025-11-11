const prisma = require('../../lib/prisma');
const openai = require('../../services/openai.service');
const logger = require('../../utils/logger');
const dayjs = require('dayjs');

class AnalyticsService {
  /**
   * Generate comprehensive business insights
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @param {number} [params.days=30] - Days to analyze
   * @returns {Promise<Object>}
   */
  async generateBusinessInsights({ brandId, branchId, days = 30 }) {
    try {
      // Gather analytics data
      const analytics = await this.gatherAnalyticsData({
        brandId,
        branchId,
        days,
      });

      // Build insights prompt
      const prompt = this.buildInsightsPrompt(analytics);

      // Get AI insights
      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: `You are a restaurant business analyst. Analyze sales data, customer behavior, and operational metrics to provide actionable insights. Always respond with valid JSON.`,
        temperature: 0.6,
        json: true,
      });

      const insights = JSON.parse(aiResponse);

      return {
        period: `Last ${days} days`,
        generatedAt: new Date(),
        analytics,
        insights: insights.insights || [],
        recommendations: insights.recommendations || [],
        opportunities: insights.opportunities || [],
        warnings: insights.warnings || [],
      };
    } catch (error) {
      logger.error('Error generating insights:', error);
      throw new Error(`Failed to generate insights: ${error.message}`);
    }
  }

  /**
   * Analyze customer preferences and behavior
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @returns {Promise<Object>}
   */
  async analyzeCustomerBehavior({ brandId, branchId }) {
    try {
      const customerData = await this.getCustomerData(brandId, branchId);

      const prompt = `Analyze customer behavior for this restaurant:

Customer Statistics:
- Total Customers: ${customerData.totalCustomers}
- New Customers (last 30 days): ${customerData.newCustomers}
- Repeat Customers: ${customerData.repeatCustomers}
- Average Order Value: $${customerData.avgOrderValue}

Popular Times:
${Object.entries(customerData.ordersByHour)
  .slice(0, 10)
  .map(([hour, count]) => `- ${hour}:00: ${count} orders`)
  .join('\n')}

Order Types:
${Object.entries(customerData.ordersByType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

Top Customer Segments:
${customerData.topCustomers
  .slice(0, 10)
  .map((c, idx) => `${idx + 1}. ${c.orderCount} orders, $${c.totalSpent} total`)
  .join('\n')}

Return a JSON object with:
{
  "patterns": ["identified behavior patterns"],
  "segments": [
    {"name": "segment name", "description": "who they are", "size": "percentage"}
  ],
  "preferences": ["what customers prefer"],
  "retention": {
    "status": "good|fair|poor",
    "suggestions": ["how to improve"]
  },
  "growth_opportunities": ["actionable opportunities"]
}`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt:
          'You are a customer behavior analyst. Identify patterns and provide actionable insights. Always respond with valid JSON.',
        temperature: 0.6,
        json: true,
      });

      return JSON.parse(aiResponse);
    } catch (error) {
      logger.error('Error analyzing customer behavior:', error);
      throw error;
    }
  }

  /**
   * Find popular item combinations
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @param {number} [params.minOccurrence=5] - Minimum times items ordered together
   * @returns {Promise<Array>}
   */
  async findPopularCombinations({ brandId, branchId, minOccurrence = 5 }) {
    try {
      // Get orders with multiple items
      const orders = await prisma.order.findMany({
        where: {
          brandId,
          branchId,
          status: { in: ['PAID', 'SERVED'] },
          createdAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
          },
        },
        include: {
          items: {
            include: { item: true },
            where: { isVoided: false },
          },
        },
      });

      // Find combinations
      const combinations = {};

      orders.forEach((order) => {
        if (order.items.length < 2) return;

        // Get all pairs
        for (let i = 0; i < order.items.length; i++) {
          for (let j = i + 1; j < order.items.length; j++) {
            const item1 = order.items[i];
            const item2 = order.items[j];

            const key = [item1.itemId, item2.itemId].sort().join('|');

            if (!combinations[key]) {
              combinations[key] = {
                item1: {
                  id: item1.itemId,
                  name: item1.item.defaultName,
                },
                item2: {
                  id: item2.itemId,
                  name: item2.item.defaultName,
                },
                count: 0,
                totalRevenue: 0,
              };
            }

            combinations[key].count++;
            combinations[key].totalRevenue +=
              Number(item1.linePrice) + Number(item2.linePrice);
          }
        }
      });

      // Filter and sort
      const popularCombos = Object.values(combinations)
        .filter((combo) => combo.count >= minOccurrence)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // Get AI analysis
      if (popularCombos.length > 0) {
        const prompt = `Analyze these popular menu item combinations:

${popularCombos
  .slice(0, 10)
  .map(
    (c, idx) =>
      `${idx + 1}. ${c.item1.name} + ${c.item2.name}: ${c.count} times, $${c.totalRevenue.toFixed(2)} revenue`
  )
  .join('\n')}

Return a JSON object with:
{
  "bundleOpportunities": [
    {
      "items": ["item1", "item2"],
      "reason": "why bundle",
      "suggestedDiscount": "percentage",
      "marketingAngle": "how to promote"
    }
  ],
  "insights": ["patterns observed"]
}`;

        const aiResponse = await openai.generateCompletion({
          prompt,
          systemPrompt:
            'You are a menu engineering expert. Identify bundle opportunities. Always respond with valid JSON.',
          temperature: 0.6,
          json: true,
        });

        const analysis = JSON.parse(aiResponse);

        return {
          combinations: popularCombos,
          ...analysis,
        };
      }

      return {
        combinations: popularCombos,
        bundleOpportunities: [],
        insights: [],
      };
    } catch (error) {
      logger.error('Error finding combinations:', error);
      throw error;
    }
  }

  /**
   * Analyze menu performance
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @returns {Promise<Object>}
   */
  async analyzeMenuPerformance({ brandId, branchId }) {
    try {
      const menuData = await this.getMenuPerformanceData(brandId, branchId);

      const prompt = `Analyze menu performance:

Top Performers:
${menuData.topItems
  .slice(0, 10)
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.name}: ${item.quantity} sold, $${item.revenue} revenue, ${item.profitMargin}% margin`
  )
  .join('\n')}

Poor Performers:
${menuData.poorItems
  .slice(0, 5)
  .map((item, idx) => `${idx + 1}. ${item.name}: ${item.quantity} sold in last 30 days`)
  .join('\n')}

Category Performance:
${Object.entries(menuData.categoryPerformance)
  .map(([cat, data]) => `- ${cat}: ${data.quantity} sold, $${data.revenue}`)
  .join('\n')}

Return a JSON object with:
{
  "stars": [{"item": "name", "reason": "why it's a star"}],
  "workhorses": [{"item": "name", "action": "what to do"}],
  "puzzles": [{"item": "name", "recommendation": "how to improve"}],
  "dogs": [{"item": "name", "recommendation": "remove or revamp"}],
  "menuOptimization": ["overall recommendations"]
}`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt:
          'You are a menu engineering expert. Use menu engineering matrix to categorize items. Always respond with valid JSON.',
        temperature: 0.6,
        json: true,
      });

      const analysis = JSON.parse(aiResponse);

      return {
        ...menuData,
        analysis,
      };
    } catch (error) {
      logger.error('Error analyzing menu performance:', error);
      throw error;
    }
  }

  /**
   * Gather comprehensive analytics data
   */
  async gatherAnalyticsData({ brandId, branchId, days }) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get orders
    const orders = await prisma.order.findMany({
      where: {
        brandId,
        branchId,
        status: { in: ['PAID', 'SERVED'] },
        createdAt: { gte: startDate },
      },
      include: {
        items: { include: { item: true } },
      },
    });

    // Calculate metrics
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const totalOrders = orders.length;

    // Items sold
    const itemsSold = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.itemId;
        if (!itemsSold[key]) {
          itemsSold[key] = {
            name: item.item.defaultName,
            quantity: 0,
            revenue: 0,
          };
        }
        itemsSold[key].quantity += item.quantity;
        itemsSold[key].revenue += Number(item.linePrice);
      });
    });

    const topItems = Object.values(itemsSold)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Order types
    const orderTypes = {};
    orders.forEach((order) => {
      orderTypes[order.type] = (orderTypes[order.type] || 0) + 1;
    });

    return {
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders,
      avgOrderValue: avgOrderValue.toFixed(2),
      topItems,
      orderTypes,
      periodDays: days,
    };
  }

  /**
   * Get customer data
   */
  async getCustomerData(brandId, branchId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const customers = await prisma.customer.findMany({
      where: { brandId },
      include: {
        orders: {
          where: {
            branchId,
            status: { in: ['PAID', 'SERVED'] },
          },
        },
      },
    });

    const newCustomers = customers.filter(
      (c) => c.createdAt >= thirtyDaysAgo
    ).length;
    const repeatCustomers = customers.filter(
      (c) => c.orders.length > 1
    ).length;

    const allOrders = await prisma.order.findMany({
      where: {
        brandId,
        branchId,
        status: { in: ['PAID', 'SERVED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    const totalRevenue = allOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
    const avgOrderValue =
      allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

    // Orders by hour
    const ordersByHour = {};
    allOrders.forEach((order) => {
      const hour = order.createdAt.getHours();
      ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
    });

    // Orders by type
    const ordersByType = {};
    allOrders.forEach((order) => {
      ordersByType[order.type] = (ordersByType[order.type] || 0) + 1;
    });

    // Top customers
    const topCustomers = customers
      .map((c) => ({
        id: c.id,
        orderCount: c.orders.length,
        totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
      }))
      .filter((c) => c.orderCount > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers: customers.length,
      newCustomers,
      repeatCustomers,
      avgOrderValue: avgOrderValue.toFixed(2),
      ordersByHour,
      ordersByType,
      topCustomers,
    };
  }

  /**
   * Get menu performance data
   */
  async getMenuPerformanceData(brandId, branchId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: {
        brandId,
        branchId,
        status: { in: ['PAID', 'SERVED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                categories: { include: { category: true } },
                variants: true,
              },
            },
          },
        },
      },
    });

    const itemPerformance = {};
    const categoryPerformance = {};

    orders.forEach((order) => {
      order.items.forEach((orderItem) => {
        const item = orderItem.item;
        const key = item.id;

        if (!itemPerformance[key]) {
          itemPerformance[key] = {
            name: item.defaultName,
            quantity: 0,
            revenue: 0,
            cost: 0,
          };
        }

        itemPerformance[key].quantity += orderItem.quantity;
        itemPerformance[key].revenue += Number(orderItem.linePrice);

        // Category performance
        item.categories.forEach((cat) => {
          const catName = cat.category.name;
          if (!categoryPerformance[catName]) {
            categoryPerformance[catName] = { quantity: 0, revenue: 0 };
          }
          categoryPerformance[catName].quantity += orderItem.quantity;
          categoryPerformance[catName].revenue += Number(orderItem.linePrice);
        });
      });
    });

    // Calculate profit margins (simplified)
    Object.values(itemPerformance).forEach((item) => {
      item.profitMargin = 30; // Placeholder - would need cost data
    });

    const topItems = Object.values(itemPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    const poorItems = Object.values(itemPerformance)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    return {
      topItems,
      poorItems,
      categoryPerformance,
    };
  }

  /**
   * Build insights prompt
   */
  buildInsightsPrompt(analytics) {
    let prompt = `Analyze this restaurant's performance data:

Period: Last ${analytics.periodDays} days
Total Revenue: $${analytics.totalRevenue}
Total Orders: ${analytics.totalOrders}
Average Order Value: $${analytics.avgOrderValue}

Top Selling Items:
${analytics.topItems.map((item, idx) => `${idx + 1}. ${item.name}: ${item.quantity} sold, $${item.revenue.toFixed(2)}`).join('\n')}

Order Types Distribution:
${Object.entries(analytics.orderTypes)
  .map(([type, count]) => `- ${type}: ${count} orders`)
  .join('\n')}

Return a JSON object with:
{
  "insights": [
    {"category": "sales|operations|menu|customer", "insight": "observation", "impact": "high|medium|low"}
  ],
  "recommendations": [
    {"action": "what to do", "reason": "why", "priority": "high|medium|low"}
  ],
  "opportunities": [
    {"opportunity": "description", "potential": "expected benefit"}
  ],
  "warnings": [
    {"warning": "potential issue", "severity": "high|medium|low"}
  ]
}`;

    return prompt;
  }
}

module.exports = new AnalyticsService();
