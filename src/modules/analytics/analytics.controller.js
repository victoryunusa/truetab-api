const dayjs = require('dayjs');
const {
  getSalesOverview,
  getRevenueTrends,
  getTopSellingItems,
  getCustomerInsights,
  getOrderStatistics,
  getDashboardAnalytics,
} = require('./analytics.service');

/**
 * Get dashboard analytics (comprehensive data)
 */
async function getDashboardController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    // Default to last 30 days if no dates provided
    const startDate = req.query.startDate || dayjs().subtract(30, 'day').toISOString();
    const endDate = req.query.endDate || dayjs().toISOString();

    const analytics = await getDashboardAnalytics(brandId, branchId, startDate, endDate);
    return res.status(200).json(analytics);
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

/**
 * Get sales overview
 */
async function getSalesOverviewController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    const startDate = req.query.startDate || dayjs().subtract(30, 'day').toISOString();
    const endDate = req.query.endDate || dayjs().toISOString();

    const overview = await getSalesOverview(brandId, branchId, startDate, endDate);
    return res.status(200).json(overview);
  } catch (error) {
    console.error('Get sales overview error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

/**
 * Get revenue trends
 */
async function getRevenueTrendsController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    const startDate = req.query.startDate || dayjs().subtract(30, 'day').toISOString();
    const endDate = req.query.endDate || dayjs().toISOString();
    const interval = req.query.interval || 'day'; // hour, day, week, month

    const trends = await getRevenueTrends(brandId, branchId, startDate, endDate, interval);
    return res.status(200).json(trends);
  } catch (error) {
    console.error('Get revenue trends error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

/**
 * Get top selling items
 */
async function getTopSellingItemsController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    const startDate = req.query.startDate || null;
    const endDate = req.query.endDate || null;
    const limit = parseInt(req.query.limit || '10', 10);

    const topItems = await getTopSellingItems(brandId, branchId, startDate, endDate, limit);
    return res.status(200).json(topItems);
  } catch (error) {
    console.error('Get top selling items error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

/**
 * Get customer insights
 */
async function getCustomerInsightsController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    const startDate = req.query.startDate || dayjs().subtract(30, 'day').toISOString();
    const endDate = req.query.endDate || dayjs().toISOString();

    const insights = await getCustomerInsights(brandId, branchId, startDate, endDate);
    return res.status(200).json(insights);
  } catch (error) {
    console.error('Get customer insights error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

/**
 * Get order statistics
 */
async function getOrderStatisticsController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    const startDate = req.query.startDate || dayjs().subtract(30, 'day').toISOString();
    const endDate = req.query.endDate || dayjs().toISOString();

    const stats = await getOrderStatistics(brandId, branchId, startDate, endDate);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Get order statistics error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getDashboardController,
  getSalesOverviewController,
  getRevenueTrendsController,
  getTopSellingItemsController,
  getCustomerInsightsController,
  getOrderStatisticsController,
};
