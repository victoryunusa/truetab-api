const { PrismaClient, SubscriptionStatus } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * AI Feature Access Levels
 */
const AI_FEATURES = {
  RECOMMENDATIONS: 'ai_recommendations',
  FORECASTING: 'ai_forecasting',
  NLP: 'ai_nlp',
  PRICING: 'ai_pricing',
  CHATBOT: 'ai_chatbot',
  ANALYTICS: 'ai_analytics',
};

/**
 * Check if brand's subscription includes AI features
 * @param {string} feature - AI feature to check
 * @param {boolean} requireActive - Require active subscription (default: true)
 */
function requireAIFeature(feature, requireActive = true) {
  return async (req, res, next) => {
    try {
      const { brandId } = req.user;

      if (!brandId) {
        return res.status(403).json({
          success: false,
          error: 'Brand context required for AI features',
        });
      }

      // Get brand's subscription
      const subscription = await prisma.subscription.findUnique({
        where: { brandId },
        include: {
          plan: true,
          brand: true,
        },
      });

      // Check if subscription exists
      if (!subscription) {
        return res.status(402).json({
          success: false,
          error: 'No active subscription found',
          message: 'Please subscribe to a plan to access AI features',
          upgrade_url: '/api/subscription/plans',
        });
      }

      // Check subscription status
      if (requireActive) {
        const activeStatuses = [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
        ];

        if (!activeStatuses.includes(subscription.status)) {
          return res.status(402).json({
            success: false,
            error: 'Subscription not active',
            message: `Your subscription is ${subscription.status}. Please renew to continue using AI features`,
            status: subscription.status,
          });
        }

        // Check if trial/subscription has expired
        const now = new Date();
        if (subscription.currentPeriodEnd < now) {
          return res.status(402).json({
            success: false,
            error: 'Subscription expired',
            message: 'Your subscription has expired. Please renew to continue.',
            expired_at: subscription.currentPeriodEnd,
          });
        }
      }

      // Check if plan includes the AI feature
      const planFeatures = subscription.plan.features || {};

      if (!planFeatures.ai_enabled) {
        return res.status(403).json({
          success: false,
          error: 'AI features not included in your plan',
          message: `Your ${subscription.plan.name} plan does not include AI features. Please upgrade to access this feature.`,
          current_plan: subscription.plan.name,
          upgrade_url: '/api/subscription/plans',
        });
      }

      // Check specific feature access
      if (feature && !planFeatures[feature]) {
        return res.status(403).json({
          success: false,
          error: 'Feature not included in your plan',
          message: `Your ${subscription.plan.name} plan does not include ${feature}. Please upgrade to access this feature.`,
          current_plan: subscription.plan.name,
          available_features: Object.keys(planFeatures).filter((k) =>
            k.startsWith('ai_')
          ),
          upgrade_url: '/api/subscription/plans',
        });
      }

      // Check usage limits if defined
      if (planFeatures.ai_monthly_requests) {
        const usageThisMonth = await getMonthlyAIUsage(brandId);

        if (usageThisMonth >= planFeatures.ai_monthly_requests) {
          return res.status(429).json({
            success: false,
            error: 'AI usage limit reached',
            message: `You have reached your monthly limit of ${planFeatures.ai_monthly_requests} AI requests. Please upgrade your plan for more capacity.`,
            usage: usageThisMonth,
            limit: planFeatures.ai_monthly_requests,
            upgrade_url: '/api/subscription/plans',
          });
        }

        // Attach usage info to request for logging
        req.aiUsage = {
          current: usageThisMonth,
          limit: planFeatures.ai_monthly_requests,
          remaining: planFeatures.ai_monthly_requests - usageThisMonth,
        };
      }

      // Attach subscription info to request
      req.subscription = {
        id: subscription.id,
        plan: subscription.plan.name,
        features: planFeatures,
      };

      next();
    } catch (error) {
      logger.error('AI feature access check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify feature access',
      });
    }
  };
}

/**
 * Log AI usage for billing and rate limiting
 */
async function logAIUsage(brandId, feature, metadata = {}) {
  try {
    await prisma.aIUsageLog.create({
      data: {
        brandId,
        feature,
        timestamp: new Date(),
        metadata,
      },
    });
  } catch (error) {
    logger.error('Failed to log AI usage:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Get monthly AI usage for a brand
 */
async function getMonthlyAIUsage(brandId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.aIUsageLog.count({
    where: {
      brandId,
      timestamp: {
        gte: startOfMonth,
      },
    },
  });

  return count;
}

/**
 * Get AI usage statistics for a brand
 */
async function getAIUsageStats(brandId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await prisma.aIUsageLog.findMany({
    where: {
      brandId,
      timestamp: {
        gte: startDate,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Group by feature
  const byFeature = {};
  logs.forEach((log) => {
    byFeature[log.feature] = (byFeature[log.feature] || 0) + 1;
  });

  // Group by day
  const byDay = {};
  logs.forEach((log) => {
    const day = log.timestamp.toISOString().split('T')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return {
    total: logs.length,
    byFeature,
    byDay,
    period: `${days} days`,
  };
}

/**
 * Middleware to track AI usage after request
 */
function trackAIUsage(feature) {
  return async (req, res, next) => {
    // Store original send
    const originalSend = res.json;

    // Override send to log usage after successful response
    res.json = function (data) {
      // Only log if request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { brandId } = req.user;
        if (brandId) {
          logAIUsage(brandId, feature, {
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
          }).catch((err) => logger.error('Usage logging error:', err));
        }
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
}

module.exports = {
  AI_FEATURES,
  requireAIFeature,
  logAIUsage,
  getMonthlyAIUsage,
  getAIUsageStats,
  trackAIUsage,
};
