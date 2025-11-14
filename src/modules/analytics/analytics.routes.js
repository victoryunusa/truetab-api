const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const { tenant } = require('../../middleware/tenant');
const { requireActiveSubscription } = require('../../middleware/subscription');
const {
  getDashboardController,
  getSalesOverviewController,
  getRevenueTrendsController,
  getTopSellingItemsController,
  getCustomerInsightsController,
  getOrderStatisticsController,
} = require('./analytics.controller');

const guards = [auth(true), tenant(true), requireActiveSubscription()];

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard', guards, getDashboardController);

/**
 * @swagger
 * /api/analytics/sales-overview:
 *   get:
 *     summary: Get sales overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Sales overview retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/sales-overview', guards, getSalesOverviewController);

/**
 * @swagger
 * /api/analytics/revenue-trends:
 *   get:
 *     summary: Get revenue trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *     responses:
 *       200:
 *         description: Revenue trends retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/revenue-trends', guards, getRevenueTrendsController);

/**
 * @swagger
 * /api/analytics/top-items:
 *   get:
 *     summary: Get top selling items
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Top selling items retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/top-items', guards, getTopSellingItemsController);

/**
 * @swagger
 * /api/analytics/customer-insights:
 *   get:
 *     summary: Get customer insights
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Customer insights retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/customer-insights', guards, getCustomerInsightsController);

/**
 * @swagger
 * /api/analytics/order-statistics:
 *   get:
 *     summary: Get order statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/order-statistics', guards, getOrderStatisticsController);

module.exports = router;
