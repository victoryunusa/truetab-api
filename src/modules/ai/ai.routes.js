const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const { authenticate } = require('../../middleware/auth');

// All AI routes require authentication
router.use(authenticate);

// === RECOMMENDATIONS ===
/**
 * @swagger
 * /api/ai/recommendations:
 *   get:
 *     summary: Get personalized menu recommendations
 *     tags: [AI - Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Customer ID for personalization
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *         description: Additional context (e.g., weather, special occasion)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: Menu recommendations
 */
router.get('/recommendations', aiController.getRecommendations);

/**
 * @swagger
 * /api/ai/recommendations/similar/{itemId}:
 *   get:
 *     summary: Get similar menu items
 *     tags: [AI - Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Similar items
 */
router.get('/recommendations/similar/:itemId', aiController.getSimilarItems);

// === FORECASTING ===
/**
 * @swagger
 * /api/ai/forecast/demand:
 *   get:
 *     summary: Forecast menu item demand
 *     tags: [AI - Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to forecast for (defaults to today)
 *       - in: query
 *         name: daysHistory
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Days of historical data to analyze
 *     responses:
 *       200:
 *         description: Demand forecast
 */
router.get('/forecast/demand', aiController.forecastDemand);

/**
 * @swagger
 * /api/ai/forecast/inventory:
 *   get:
 *     summary: Forecast inventory needs
 *     tags: [AI - Forecasting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Days to forecast ahead
 *     responses:
 *       200:
 *         description: Inventory forecast
 */
router.get('/forecast/inventory', aiController.forecastInventory);

// === NLP ===
/**
 * @swagger
 * /api/ai/nlp/parse-order:
 *   post:
 *     summary: Parse natural language order
 *     tags: [AI - NLP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "2 margherita pizzas and a coke"
 *     responses:
 *       200:
 *         description: Parsed order
 */
router.post('/nlp/parse-order', aiController.parseOrder);

/**
 * @swagger
 * /api/ai/nlp/search:
 *   get:
 *     summary: Search menu using natural language
 *     tags: [AI - NLP]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: "something spicy with chicken"
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/nlp/search', aiController.searchMenu);

/**
 * @swagger
 * /api/ai/nlp/intent:
 *   post:
 *     summary: Extract customer intent from text
 *     tags: [AI - NLP]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "I want to book a table for 4 people tomorrow at 7pm"
 *     responses:
 *       200:
 *         description: Extracted intent
 */
router.post('/nlp/intent', aiController.extractIntent);

// === PRICING ===
/**
 * @swagger
 * /api/ai/pricing/suggestions:
 *   get:
 *     summary: Get dynamic pricing suggestions
 *     tags: [AI - Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         description: Specific item ID (optional)
 *     responses:
 *       200:
 *         description: Pricing suggestions
 */
router.get('/pricing/suggestions', aiController.getPricingSuggestions);

/**
 * @swagger
 * /api/ai/pricing/elasticity/{itemId}:
 *   get:
 *     summary: Analyze price elasticity for an item
 *     tags: [AI - Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Price elasticity analysis
 */
router.get('/pricing/elasticity/:itemId', aiController.analyzePriceElasticity);

/**
 * @swagger
 * /api/ai/pricing/bundle:
 *   post:
 *     summary: Suggest bundle pricing
 *     tags: [AI - Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemIds
 *             properties:
 *               itemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["item-id-1", "item-id-2"]
 *     responses:
 *       200:
 *         description: Bundle pricing suggestion
 */
router.post('/pricing/bundle', aiController.suggestBundlePricing);

// === CHATBOT ===
/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with support bot
 *     tags: [AI - Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: "How do I close a register session?"
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     content:
 *                       type: string
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bot response
 */
router.post('/chat', aiController.chat);

/**
 * @swagger
 * /api/ai/chat/quick-answer:
 *   get:
 *     summary: Get quick answer for common question
 *     tags: [AI - Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: question
 *         required: true
 *         schema:
 *           type: string
 *         example: "How to add a menu item?"
 *     responses:
 *       200:
 *         description: Quick answer
 */
router.get('/chat/quick-answer', aiController.getQuickAnswer);

/**
 * @swagger
 * /api/ai/chat/help-topics:
 *   get:
 *     summary: Suggest relevant help topics
 *     tags: [AI - Chatbot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Suggested topics
 */
router.get('/chat/help-topics', aiController.suggestHelpTopics);

/**
 * @swagger
 * /api/ai/chat/troubleshoot:
 *   post:
 *     summary: Generate troubleshooting steps
 *     tags: [AI - Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issue
 *             properties:
 *               issue:
 *                 type: string
 *                 example: "Printer is not responding"
 *     responses:
 *       200:
 *         description: Troubleshooting steps
 */
router.post('/chat/troubleshoot', aiController.getTroubleshooting);

// === ANALYTICS ===
/**
 * @swagger
 * /api/ai/analytics/insights:
 *   get:
 *     summary: Get comprehensive business insights
 *     tags: [AI - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Days to analyze
 *     responses:
 *       200:
 *         description: Business insights
 */
router.get('/analytics/insights', aiController.getBusinessInsights);

/**
 * @swagger
 * /api/ai/analytics/customer-behavior:
 *   get:
 *     summary: Analyze customer behavior patterns
 *     tags: [AI - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer behavior analysis
 */
router.get(
  '/analytics/customer-behavior',
  aiController.analyzeCustomerBehavior
);

/**
 * @swagger
 * /api/ai/analytics/combinations:
 *   get:
 *     summary: Find popular item combinations
 *     tags: [AI - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minOccurrence
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Minimum times items ordered together
 *     responses:
 *       200:
 *         description: Popular combinations
 */
router.get('/analytics/combinations', aiController.getPopularCombinations);

/**
 * @swagger
 * /api/ai/analytics/menu-performance:
 *   get:
 *     summary: Analyze menu performance
 *     tags: [AI - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menu performance analysis
 */
router.get('/analytics/menu-performance', aiController.analyzeMenuPerformance);

module.exports = router;
