const prisma = require('../../lib/prisma');
const openai = require('../../services/openai.service');
const { logger } = require('../../utils/logger');
const dayjs = require('dayjs');

class ForecastingService {
  /**
   * Forecast demand for menu items
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @param {Date} params.forecastDate - Date to forecast for
   * @param {number} [params.daysHistory=90] - Days of history to analyze
   * @returns {Promise<Object>}
   */
  async forecastMenuItemDemand({
    brandId,
    branchId,
    forecastDate = new Date(),
    daysHistory = 90,
  }) {
    try {
      // Get historical sales data
      const historicalData = await this.getHistoricalSales(
        brandId,
        branchId,
        daysHistory
      );

      // Analyze patterns
      const patterns = this.analyzePatterns(historicalData);

      // Get day of week context
      const targetDay = dayjs(forecastDate).format('dddd');
      const targetDate = dayjs(forecastDate).format('YYYY-MM-DD');

      // Build forecast prompt
      const prompt = this.buildForecastPrompt({
        historicalData,
        patterns,
        targetDay,
        targetDate,
      });

      // Get AI forecast
      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: `You are a sales forecasting expert for restaurants. Analyze historical data and patterns to predict demand. Always respond with valid JSON.`,
        temperature: 0.5,
        json: true,
      });

      const forecast = JSON.parse(aiResponse);

      return {
        forecastDate: targetDate,
        dayOfWeek: targetDay,
        predictions: forecast.predictions || [],
        expectedRevenue: forecast.expectedRevenue || 0,
        confidence: forecast.confidence || 'medium',
        insights: forecast.insights || [],
        patterns,
      };
    } catch (error) {
      logger.error('Error forecasting demand:', error);
      throw new Error(`Failed to generate forecast: ${error.message}`);
    }
  }

  /**
   * Forecast inventory needs
   * @param {Object} params
   * @param {string} params.brandId
   * @param {string} params.branchId
   * @param {number} [params.daysAhead=7] - Days to forecast ahead
   * @returns {Promise<Object>}
   */
  async forecastInventoryNeeds({ brandId, branchId, daysAhead = 7 }) {
    try {
      // Get current stock levels
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
                    include: {
                      item: true,
                      variant: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Get historical consumption rates
      const consumptionData = await this.getConsumptionRates(
        brandId,
        branchId,
        30
      );

      // Build inventory forecast prompt
      const prompt = `Analyze the following inventory data and predict needs for the next ${daysAhead} days.

Current Stock Levels:
${stockLevels
  .slice(0, 20)
  .map((s) => `- ${s.product.name}: ${s.quantity} ${s.product.unit}`)
  .join('\n')}

Recent Consumption Patterns:
${consumptionData
  .slice(0, 15)
  .map((c) => `- ${c.productName}: avg ${c.avgDaily} ${c.unit}/day`)
  .join('\n')}

Return a JSON object with:
{
  "recommendations": [
    {
      "product": "product name",
      "currentStock": number,
      "recommendedOrder": number,
      "unit": "unit",
      "priority": "high|medium|low",
      "reason": "explanation"
    }
  ],
  "alerts": ["critical stock alerts"],
  "insights": ["general insights"]
}`;

      const aiResponse = await openai.generateCompletion({
        prompt,
        systemPrompt: `You are an inventory management expert. Analyze stock levels and consumption patterns to prevent stockouts and minimize waste. Always respond with valid JSON.`,
        temperature: 0.5,
        json: true,
      });

      const forecast = JSON.parse(aiResponse);

      return {
        forecastDays: daysAhead,
        generatedAt: new Date(),
        recommendations: forecast.recommendations || [],
        alerts: forecast.alerts || [],
        insights: forecast.insights || [],
      };
    } catch (error) {
      logger.error('Error forecasting inventory:', error);
      throw new Error(`Failed to forecast inventory: ${error.message}`);
    }
  }

  /**
   * Get historical sales data
   */
  async getHistoricalSales(brandId, branchId, days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        brandId,
        branchId,
        status: { in: ['PAID', 'SERVED'] },
        createdAt: { gte: startDate },
      },
      include: {
        items: {
          include: { item: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day and item
    const salesByDay = {};
    orders.forEach((order) => {
      const day = dayjs(order.createdAt).format('YYYY-MM-DD');
      const dayOfWeek = dayjs(order.createdAt).format('dddd');

      if (!salesByDay[day]) {
        salesByDay[day] = {
          date: day,
          dayOfWeek,
          total: 0,
          items: {},
        };
      }

      salesByDay[day].total += Number(order.total);

      order.items.forEach((item) => {
        const itemName = item.item.defaultName;
        if (!salesByDay[day].items[itemName]) {
          salesByDay[day].items[itemName] = 0;
        }
        salesByDay[day].items[itemName] += item.quantity;
      });
    });

    return Object.values(salesByDay);
  }

  /**
   * Analyze sales patterns
   */
  analyzePatterns(historicalData) {
    if (historicalData.length === 0) {
      return {
        avgDailySales: 0,
        avgWeeklySales: 0,
        topItems: [],
        dayOfWeekTrends: {},
      };
    }

    // Calculate averages
    const totalSales = historicalData.reduce(
      (sum, day) => sum + day.total,
      0
    );
    const avgDailySales = totalSales / historicalData.length;
    const avgWeeklySales = avgDailySales * 7;

    // Find top items
    const itemTotals = {};
    historicalData.forEach((day) => {
      Object.entries(day.items).forEach(([itemName, quantity]) => {
        itemTotals[itemName] = (itemTotals[itemName] || 0) + quantity;
      });
    });

    const topItems = Object.entries(itemTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, total]) => ({
        name,
        total,
        avgDaily: (total / historicalData.length).toFixed(2),
      }));

    // Day of week trends
    const dayTotals = {};
    const dayCounts = {};

    historicalData.forEach((day) => {
      const dow = day.dayOfWeek;
      dayTotals[dow] = (dayTotals[dow] || 0) + day.total;
      dayCounts[dow] = (dayCounts[dow] || 0) + 1;
    });

    const dayOfWeekTrends = {};
    Object.keys(dayTotals).forEach((dow) => {
      dayOfWeekTrends[dow] = {
        avgSales: (dayTotals[dow] / dayCounts[dow]).toFixed(2),
        count: dayCounts[dow],
      };
    });

    return {
      avgDailySales: avgDailySales.toFixed(2),
      avgWeeklySales: avgWeeklySales.toFixed(2),
      topItems,
      dayOfWeekTrends,
    };
  }

  /**
   * Build forecast prompt
   */
  buildForecastPrompt({ historicalData, patterns, targetDay, targetDate }) {
    const recentDays = historicalData.slice(-14);

    let prompt = `Forecast sales for ${targetDate} (${targetDay}).\n\n`;

    prompt += `Historical Patterns:\n`;
    prompt += `- Average Daily Sales: $${patterns.avgDailySales}\n`;
    prompt += `- ${targetDay} Average: $${patterns.dayOfWeekTrends[targetDay]?.avgSales || 'N/A'}\n\n`;

    prompt += `Top Selling Items:\n`;
    patterns.topItems.forEach((item, idx) => {
      prompt += `${idx + 1}. ${item.name}: ${item.avgDaily} per day\n`;
    });

    prompt += `\nRecent 14 Days:\n`;
    recentDays.forEach((day) => {
      prompt += `- ${day.date} (${day.dayOfWeek}): $${day.total.toFixed(2)}\n`;
    });

    prompt += `\nReturn a JSON object with:\n`;
    prompt += `{\n`;
    prompt += `  "predictions": [\n`;
    prompt += `    {"item": "item name", "expectedQuantity": number, "confidence": "high|medium|low"}\n`;
    prompt += `  ],\n`;
    prompt += `  "expectedRevenue": number,\n`;
    prompt += `  "confidence": "high|medium|low",\n`;
    prompt += `  "insights": ["insight 1", "insight 2"]\n`;
    prompt += `}`;

    return prompt;
  }

  /**
   * Get consumption rates for inventory
   */
  async getConsumptionRates(brandId, branchId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.stockTransaction.findMany({
      where: {
        brandId,
        createdAt: { gte: startDate },
        type: 'SALE',
      },
      include: {
        product: true,
      },
    });

    const productUsage = {};

    transactions.forEach((tx) => {
      const productName = tx.product.name;
      if (!productUsage[productName]) {
        productUsage[productName] = {
          productName,
          unit: tx.product.unit,
          total: 0,
          count: 0,
        };
      }
      productUsage[productName].total += Number(tx.quantity);
      productUsage[productName].count += 1;
    });

    return Object.values(productUsage).map((p) => ({
      ...p,
      avgDaily: (p.total / days).toFixed(2),
    }));
  }
}

module.exports = new ForecastingService();
