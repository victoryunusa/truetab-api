# AI Features & Subscription Integration

## Overview

All AI features in TrueTab are now integrated with the subscription system. Access to AI capabilities is controlled by subscription plans, with usage tracking and rate limiting built-in.

## Subscription Plans with AI

### 📊 Pricing Tiers

| Plan | Monthly | Yearly | AI Features | AI Requests/Month |
|------|---------|--------|-------------|-------------------|
| **Starter** | $29 | $290 | ❌ None | - |
| **Professional** | $79 | $790 | ✅ Core (3 features) | 1,000 |
| **Enterprise** | $149 | $1,490 | ✅ Full Suite (6 features) | 5,000 |
| **Ultimate** | $299 | $2,990 | ✅ Full Suite + Priority | ♾️ Unlimited |

### Feature Breakdown

#### Starter Plan ($29/mo)
- ❌ **NO AI Features**
- Basic POS functionality
- 1 Branch, 5 Staff
- Email support (48h response)

#### Professional Plan ($79/mo)
- ✅ **AI Recommendations** - Smart menu suggestions
- ✅ **AI Chatbot** - Staff support assistant
- ✅ **AI Analytics** - Basic business insights
- ⚠️ Limit: 1,000 AI requests/month (~33/day)
- 3 Branches, 15 Staff
- Priority email support (24h)

#### Enterprise Plan ($149/mo)
- ✅ **All Professional Features**
- ✅ **AI Forecasting** - Sales & inventory predictions
- ✅ **AI NLP** - Natural language processing
- ✅ **AI Pricing** - Dynamic pricing intelligence
- ⚠️ Limit: 5,000 AI requests/month (~166/day)
- 10 Branches, 50 Staff
- Phone + email support (12h)
- API access

#### Ultimate Plan ($299/mo)
- ✅ **All Enterprise Features**
- ⚠️ **Unlimited AI Requests**
- 🚀 Priority AI processing
- ♾️ Unlimited branches & staff
- White-label options
- 24/7 dedicated support (1h response)
- Dedicated account manager

## How It Works

### 1. Feature Access Control

Every AI endpoint is protected by subscription checks:

```javascript
// Example: Recommendations endpoint
router.get('/recommendations',
  requireAIFeature(AI_FEATURES.RECOMMENDATIONS),  // Check subscription
  trackAIUsage(AI_FEATURES.RECOMMENDATIONS),      // Log usage
  aiController.getRecommendations
);
```

### 2. Access Flow

```
User Request → Auth Middleware → Feature Check → Usage Check → AI Endpoint
                                       ↓              ↓
                                   Subscription   Monthly Limit
                                   Plan Check     Verification
```

### 3. Response Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | AI feature executed |
| 402 | Payment Required | No subscription or expired |
| 403 | Forbidden | Feature not in plan |
| 429 | Too Many Requests | Monthly limit reached |
| 500 | Server Error | Internal error |

## Usage Tracking

### Automatic Logging

All AI requests are automatically logged:

```javascript
{
  brandId: "brand-uuid",
  feature: "ai_recommendations",
  timestamp: "2025-01-11T12:00:00Z",
  metadata: {
    endpoint: "/api/ai/recommendations",
    method: "GET",
    statusCode: 200
  }
}
```

### Monthly Limits

- Tracked per brand
- Resets on 1st of each month
- Remaining requests shown in response headers (future enhancement)

## Setup Instructions

### 1. Update Database Schema

```bash
npx prisma generate
npx prisma db push
```

This adds the `AIUsageLog` table.

### 2. Seed Subscription Plans

```bash
node prisma/seeds/subscription-plans-ai.js
```

This creates/updates the 4 subscription tiers with AI features.

### 3. Test Feature Access

```bash
# Get available plans
curl http://localhost:9000/api/subscription/plans

# Subscribe to a plan (requires auth)
curl -X POST http://localhost:9000/api/subscription/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-uuid",
    "period": "monthly"
  }'

# Try AI endpoint
curl http://localhost:9000/api/ai/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Responses

### No Subscription

```json
{
  "success": false,
  "error": "No active subscription found",
  "message": "Please subscribe to a plan to access AI features",
  "upgrade_url": "/api/subscription/plans"
}
```

### Feature Not Included

```json
{
  "success": false,
  "error": "Feature not included in your plan",
  "message": "Your Professional plan does not include ai_pricing. Please upgrade to access this feature.",
  "current_plan": "Professional",
  "available_features": ["ai_recommendations", "ai_chatbot", "ai_analytics"],
  "upgrade_url": "/api/subscription/plans"
}
```

### Monthly Limit Reached

```json
{
  "success": false,
  "error": "AI usage limit reached",
  "message": "You have reached your monthly limit of 1000 AI requests. Please upgrade your plan for more capacity.",
  "usage": 1000,
  "limit": 1000,
  "upgrade_url": "/api/subscription/plans"
}
```

## API Endpoints for Usage

### Get Usage Statistics

```javascript
// In your code
const { getAIUsageStats } = require('./middleware/aiFeatureAccess');

const stats = await getAIUsageStats(brandId, 30);
// Returns:
{
  total: 450,
  byFeature: {
    ai_recommendations: 200,
    ai_chatbot: 150,
    ai_analytics: 100
  },
  byDay: {
    "2025-01-01": 15,
    "2025-01-02": 20,
    ...
  },
  period: "30 days"
}
```

## Pricing Rationale

### Why These Prices?

**Starter ($29/mo)** - Entry Point
- No AI = Lower operational costs
- Targets small single-location restaurants
- Establishes brand presence

**Professional ($79/mo)** - Sweet Spot
- 3 AI features = High value perception
- 1,000 requests = ~$10-15 OpenAI cost
- 65% margin after AI costs
- Targets growing restaurants

**Enterprise ($149/mo)** - Full Suite
- 6 AI features = Complete solution
- 5,000 requests = ~$50-75 OpenAI cost
- 50% margin after AI costs
- Targets restaurant chains

**Ultimate ($299/mo)** - Premium
- Unlimited AI = Predictable cost for customer
- You absorb AI costs (plan for ~$100-150 OpenAI)
- 50% margin after all costs
- Targets large enterprises with budget

### Cost Analysis

| Plan | OpenAI Cost | Your Margin | Net Profit |
|------|-------------|-------------|------------|
| Starter | $0 | 100% | $29 |
| Professional | ~$12 | 85% | $67 |
| Enterprise | ~$60 | 60% | $89 |
| Ultimate | ~$150 | 50% | $149 |

*Assumes average usage at limit. Actual varies.*

## Best Practices

### 1. Monitor Usage

```sql
-- Top AI consumers
SELECT brandId, COUNT(*) as requests
FROM ai_usage_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY brandId
ORDER BY requests DESC
LIMIT 10;
```

### 2. Set Up Alerts

- Alert when brand reaches 80% of limit
- Alert when Ultimate plan usage is abnormally high
- Alert when any plan exceeds expected OpenAI costs

### 3. Optimize AI Costs

- Cache frequently requested insights
- Use GPT-3.5 for simple queries (cheaper)
- Implement request debouncing on frontend
- Batch similar requests when possible

### 4. Upsell Opportunities

Trigger upgrade prompts when:
- User reaches 80% of monthly limit
- User attempts to use unavailable feature
- User consistently uses all available features

## Future Enhancements

### Planned Features

1. **Usage Dashboard**
   - Real-time usage metrics
   - Feature-by-feature breakdown
   - Cost forecasting

2. **Flexible Limits**
   - Pay-as-you-go add-ons
   - Burst capacity for special events
   - Custom enterprise limits

3. **AI Credits System**
   - Purchase additional AI credits
   - Roll over unused credits
   - Gift credits to customers

4. **Smart Throttling**
   - Slow down vs. hard stop at limit
   - Priority queue for Ultimate plan
   - Cache-first for near-limit users

## Testing

### Test Plan Access

```javascript
// Test that Starter plan blocks AI
// Expected: 403 Forbidden

// Test that Professional allows recommendations
// Expected: 200 OK

// Test that Professional blocks pricing
// Expected: 403 Forbidden

// Test monthly limit enforcement
// Expected: 429 after limit reached

// Test unlimited Ultimate plan
// Expected: Never hits limit
```

### Test Script

```bash
# Run tests
npm run test:ai-subscription

# Manual test
./scripts/test-ai-subscription.sh
```

## Migration Guide

### Existing Customers

If you have existing customers without subscriptions:

1. **Option A: Grandfather Them**
   ```javascript
   // Give existing brands Professional plan
   await prisma.subscription.create({
     data: {
       brandId: existingBrand.id,
       planId: professionalPlan.id,
       status: 'ACTIVE',
       currentPeriodEnd: oneYearFromNow,
     }
   });
   ```

2. **Option B: Trial Period**
   ```javascript
   // Give 30-day trial of Enterprise
   await startTrial({
     brandId: existingBrand.id,
     planId: enterprisePlan.id,
     trialDays: 30
   });
   ```

## Support

### Common Issues

**Q: AI features not working after subscription**
A: Run `npx prisma generate` and restart server

**Q: Usage not being tracked**
A: Check logs for `AIUsageLog` errors

**Q: Unlimited plan hitting limits**
A: Verify `ai_monthly_requests: null` in plan features

**Q: Wrong features available**
A: Re-seed plans with `node prisma/seeds/subscription-plans-ai.js`

## Summary

✅ AI features integrated with subscriptions
✅ 4 pricing tiers defined
✅ Usage tracking implemented
✅ Rate limiting enforced
✅ Clear upgrade paths
✅ Profitable margins
✅ Scalable architecture

Your AI features are now monetized and ready for production! 🚀
