# AI + Subscription Quick Reference Card

## 🚀 Setup Checklist

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push Database Changes
npx prisma db push

# 3. Seed Subscription Plans
node prisma/seeds/subscription-plans-ai.js

# 4. Add OpenAI Key to .env
echo "OPENAI_API_KEY=sk-your-key" >> .env

# 5. Start Server
npm run dev

# 6. Test
curl http://localhost:9000/api/subscription/plans
```

## 💰 Pricing at a Glance

| Plan         | Price   | AI         | Requests |
| ------------ | ------- | ---------- | -------- | --- | --- |
| <!-- #       | Starter | $29        | ❌       | -   | --> |
| Professional | $99     | 3 features | 1K/mo    |
| Enterprise   | $199    | 6 features | 5K/mo    |
| Ultimate     | $499    | Unlimited  | ∞        |

## 🎯 Feature Matrix

| Feature         | Pro | Ent | Ult |
| --------------- | --- | --- | --- |
| Recommendations | ✅  | ✅  | ✅  |
| Chatbot         | ✅  | ✅  | ✅  |
| Analytics       | ✅  | ✅  | ✅  |
| Forecasting     | ❌  | ✅  | ✅  |
| NLP             | ❌  | ✅  | ✅  |
| Pricing         | ❌  | ✅  | ✅  |

## 📊 Profitability

```
Plan → OpenAI Cost → Your Margin
────────────────────────────────
Pro  → ~$12/mo    → $67 (85%)
Ent  → ~$60/mo    → $89 (60%)
Ult  → ~$150/mo   → $149 (50%)
```

## 🔒 Access Control

Every AI endpoint is protected:

```javascript
router.get(
  '/endpoint',
  requireAIFeature(AI_FEATURES.FEATURE_NAME),
  trackAIUsage(AI_FEATURES.FEATURE_NAME),
  controller.method
);
```

## 🚫 Error Codes

| Code | Meaning             | Fix               |
| ---- | ------------------- | ----------------- |
| 402  | No subscription     | Subscribe to plan |
| 403  | Feature not in plan | Upgrade plan      |
| 429  | Limit reached       | Upgrade or wait   |

## 📈 Usage Tracking

Automatic logging of:

- Brand ID
- Feature used
- Timestamp
- Metadata (endpoint, method, status)

Query usage:

```javascript
const { getAIUsageStats } = require('./middleware/aiFeatureAccess');
const stats = await getAIUsageStats(brandId, 30);
```

## 🎓 Common Tasks

### Subscribe User to Plan

```javascript
POST /api/subscription/subscribe
{
  "planId": "uuid",
  "period": "monthly"
}
```

### Check AI Feature Access

```javascript
GET / api / ai / recommendations;
// Returns 200 if allowed
// Returns 402/403/429 if not
```

### Monitor Usage

```sql
SELECT COUNT(*)
FROM ai_usage_logs
WHERE brandId = 'uuid'
AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 MONTH);
```

## 🔥 Revenue Targets

**Month 3**: 50 customers = $4K MRR
**Month 6**: 200 customers = $15K MRR
**Month 12**: 500 customers = $40K MRR

## 📞 Support

- Dev Docs: `AI_FEATURES.md`
- Subscription: `AI_SUBSCRIPTION_INTEGRATION.md`
- Summary: `FINAL_SUMMARY.md`
- API Docs: http://localhost:9000/api-docs

## ✅ Pre-Launch Checklist

- [ ] Database migrated
- [ ] Plans seeded
- [ ] OpenAI key added
- [ ] Test subscription created
- [ ] All AI endpoints tested
- [ ] Error responses verified
- [ ] Usage tracking confirmed
- [ ] Documentation reviewed

---

**Status**: ✅ Ready for Production
**Version**: 1.0.0
**Date**: January 11, 2025
