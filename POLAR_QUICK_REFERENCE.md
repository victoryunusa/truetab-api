# Polar.sh Quick Reference

## Environment Variables
```env
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=polar_wh_xxxxxxxxxxxxx
POLAR_ORGANIZATION_ID=your_org_id
```

## API Usage

### Create Checkout (Polar)
```javascript
POST /api/subscriptions/brands/:brandId/checkout
{
  "planId": "uuid",
  "period": "monthly",
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel",
  "provider": "POLAR"  // ← Key parameter
}
```

### Subscribe Directly (Polar)
```javascript
POST /api/subscriptions/brands/:brandId/subscribe
{
  "planId": "uuid",
  "period": "monthly",
  "provider": "POLAR"  // ← Key parameter
}
```

### Get Billing Portal (Polar)
```javascript
POST /api/subscriptions/brands/:brandId/billing-portal
{
  "returnUrl": "https://app.com/settings",
  "provider": "POLAR"  // ← Key parameter
}
```

### Cancel Subscription
```javascript
POST /api/subscriptions/brands/:brandId/cancel
{
  "immediate": false  // true = cancel now, false = cancel at period end
}
// Works automatically with whichever provider the subscription uses
```

### Reactivate Subscription
```javascript
POST /api/subscriptions/brands/:brandId/reactivate
// Works automatically with whichever provider the subscription uses
```

### Change Plan
```javascript
POST /api/subscriptions/brands/:brandId/change-plan
{
  "newPlanId": "uuid",
  "period": "yearly"
}
// Works automatically with whichever provider the subscription uses
```

## Webhook Configuration

**URL**: `https://your-api.com/api/subscriptions/webhook/polar`

**Events**:
- subscription.created
- subscription.updated
- subscription.canceled
- subscription.active
- subscription.past_due
- checkout.completed

## Database Fields

### Brand Model
- `polarCustomerId` - Polar customer ID

### SubscriptionPlan Model
- `polarProductIdMonthly` - Polar product ID for monthly billing
- `polarProductIdYearly` - Polar product ID for yearly billing

### Subscription Model
- `provider` - STRIPE or POLAR
- `polarSubscriptionId` - Polar subscription ID
- `polarProductId` - Current Polar product ID

## Code Examples

### Check which provider a subscription uses
```javascript
const subscription = await prisma.subscription.findUnique({
  where: { brandId },
});

if (subscription.provider === 'POLAR') {
  // Use Polar
} else {
  // Use Stripe
}
```

### Create plan that works with both providers
```javascript
const plan = await prisma.subscriptionPlan.create({
  data: {
    name: "Pro Plan",
    priceMonthly: 29.99,
    priceYearly: 299.99,
    currency: "USD",
    // Polar/Stripe IDs will be synced automatically when used
  }
});
```

## Testing

### Local webhook testing with ngrok
```bash
# Terminal 1: Start your API
npm run dev

# Terminal 2: Start ngrok
ngrok http 9000

# Use the ngrok URL in Polar webhook settings
```

### Manual webhook test
```bash
curl -X POST http://localhost:9000/api/subscriptions/webhook/polar \
  -H "Content-Type: application/json" \
  -H "Polar-Signature: test" \
  -d '{"type": "subscription.created", "data": {...}}'
```

## Common Issues

### Issue: "POLAR_ACCESS_TOKEN is not configured"
**Solution**: Add Polar credentials to `.env` file

### Issue: Webhook not working
**Solution**: 
1. Check webhook URL is correct in Polar dashboard
2. Verify POLAR_WEBHOOK_SECRET matches
3. Check server logs for errors

### Issue: Product not found
**Solution**: Plans auto-sync to Polar on first use. Make sure POLAR_ORGANIZATION_ID is set.

## Files to Know

- `src/services/polar.service.js` - Polar API client
- `src/modules/subscriptions/polar-webhook.controller.js` - Webhook handler
- `src/modules/subscriptions/subscription.service.js` - Main subscription logic
- `docs/POLAR_INTEGRATION.md` - Full documentation

## Support Links

- Polar Docs: https://docs.polar.sh
- Polar API: https://docs.polar.sh/api
- Polar Dashboard: https://polar.sh/dashboard
