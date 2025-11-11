const recommendationService = require('./recommendation.service');
const forecastingService = require('./forecasting.service');
const nlpService = require('./nlp.service');
const pricingService = require('./pricing.service');
const chatbotService = require('./chatbot.service');
const analyticsService = require('./analytics.service');
const { logger } = require('../../utils/logger');

class AIController {
  // === RECOMMENDATIONS ===
  async getRecommendations(req, res) {
    try {
      const { customerId, context, limit } = req.query;
      const { brandId, branchId } = req.user;

      const recommendations = await recommendationService.getMenuRecommendations({
        brandId,
        branchId,
        customerId,
        context,
        limit: limit ? parseInt(limit) : 5,
      });

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      logger.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getSimilarItems(req, res) {
    try {
      const { itemId } = req.params;
      const { limit } = req.query;

      const similarItems = await recommendationService.getSimilarItems(
        itemId,
        limit ? parseInt(limit) : 5
      );

      res.json({
        success: true,
        data: similarItems,
      });
    } catch (error) {
      logger.error('Get similar items error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // === FORECASTING ===
  async forecastDemand(req, res) {
    try {
      const { brandId, branchId } = req.user;
      const { date, daysHistory } = req.query;

      const forecast = await forecastingService.forecastMenuItemDemand({
        brandId,
        branchId,
        forecastDate: date ? new Date(date) : new Date(),
        daysHistory: daysHistory ? parseInt(daysHistory) : 90,
      });

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      logger.error('Forecast demand error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async forecastInventory(req, res) {
    try {
      const { brandId, branchId } = req.user;
      const { daysAhead } = req.query;

      const forecast = await forecastingService.forecastInventoryNeeds({
        brandId,
        branchId,
        daysAhead: daysAhead ? parseInt(daysAhead) : 7,
      });

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error) {
      logger.error('Forecast inventory error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // === NLP ===
  async parseOrder(req, res) {
    try {
      const { text } = req.body;
      const { brandId, branchId } = req.user;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Order text is required',
        });
      }

      const parsed = await nlpService.parseOrder({
        text,
        brandId,
        branchId,
      });

      res.json({
        success: true,
        data: parsed,
      });
    } catch (error) {
      logger.error('Parse order error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async searchMenu(req, res) {
    try {
      const { query } = req.query;
      const { brandId } = req.user;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      const results = await nlpService.searchMenuByNaturalLanguage({
        query,
        brandId,
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error('Search menu error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async extractIntent(req, res) {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required',
        });
      }

      const intent = await nlpService.extractIntent(text);

      res.json({
        success: true,
        data: intent,
      });
    } catch (error) {
      logger.error('Extract intent error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // === PRICING ===
  async getPricingSuggestions(req, res) {
    try {
      const { brandId, branchId } = req.user;
      const { itemId } = req.query;

      const suggestions = await pricingService.getDynamicPricingSuggestions({
        brandId,
        branchId,
        itemId,
      });

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      logger.error('Get pricing suggestions error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async analyzePriceElasticity(req, res) {
    try {
      const { itemId } = req.params;

      const analysis = await pricingService.analyzePriceElasticity(itemId);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Analyze price elasticity error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async suggestBundlePricing(req, res) {
    try {
      const { itemIds } = req.body;
      const { brandId } = req.user;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least 2 item IDs required',
        });
      }

      const bundlePricing = await pricingService.suggestBundlePricing({
        brandId,
        itemIds,
      });

      res.json({
        success: true,
        data: bundlePricing,
      });
    } catch (error) {
      logger.error('Suggest bundle pricing error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // === CHATBOT ===
  async chat(req, res) {
    try {
      const { message, history, context } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
        });
      }

      const response = await chatbotService.chat({
        message,
        history: history || [],
        context,
      });

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      logger.error('Chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getQuickAnswer(req, res) {
    try {
      const { question } = req.query;

      if (!question) {
        return res.status(400).json({
          success: false,
          error: 'Question is required',
        });
      }

      const answer = await chatbotService.getQuickAnswer(question);

      res.json({
        success: true,
        data: answer,
      });
    } catch (error) {
      logger.error('Get quick answer error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async suggestHelpTopics(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required',
        });
      }

      const topics = await chatbotService.suggestHelpTopics(query);

      res.json({
        success: true,
        data: topics,
      });
    } catch (error) {
      logger.error('Suggest help topics error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getTroubleshooting(req, res) {
    try {
      const { issue } = req.body;

      if (!issue) {
        return res.status(400).json({
          success: false,
          error: 'Issue description is required',
        });
      }

      const steps = await chatbotService.generateTroubleshootingSteps(issue);

      res.json({
        success: true,
        data: steps,
      });
    } catch (error) {
      logger.error('Get troubleshooting error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  // === ANALYTICS ===
  async getBusinessInsights(req, res) {
    try {
      const { brandId, branchId } = req.user;
      const { days } = req.query;

      const insights = await analyticsService.generateBusinessInsights({
        brandId,
        branchId,
        days: days ? parseInt(days) : 30,
      });

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      logger.error('Get business insights error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async analyzeCustomerBehavior(req, res) {
    try {
      const { brandId, branchId } = req.user;

      const analysis = await analyticsService.analyzeCustomerBehavior({
        brandId,
        branchId,
      });

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Analyze customer behavior error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getPopularCombinations(req, res) {
    try {
      const { brandId, branchId } = req.user;
      const { minOccurrence } = req.query;

      const combinations = await analyticsService.findPopularCombinations({
        brandId,
        branchId,
        minOccurrence: minOccurrence ? parseInt(minOccurrence) : 5,
      });

      res.json({
        success: true,
        data: combinations,
      });
    } catch (error) {
      logger.error('Get popular combinations error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async analyzeMenuPerformance(req, res) {
    try {
      const { brandId, branchId } = req.user;

      const analysis = await analyticsService.analyzeMenuPerformance({
        brandId,
        branchId,
      });

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error('Analyze menu performance error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new AIController();
