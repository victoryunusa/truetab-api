# Polar.sh Integration Guide

This guide explains how to use Polar.sh as a payment provider for subscriptions in TrueTab API.

## Overview

TrueTab API now supports both **Stripe** and **Polar.sh** as payment providers for subscription management. You can choose either provider based on your needs:

- **Stripe**: Traditional payment processor with extensive features
- **Polar.sh**: Modern payment infrastructure designed for developers and open-source projects

## Setup

### 1. Install Dependencies

First, install the axios package if not already installed:

```bash
npm install axios
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

#### Polar Configuration

```env
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_ORGANIZATION_ID=your_polar_organization_id
```

#### Getting Polar Credentials

1. Sign up at [https://polar.sh](https://polar.sh)
2. Create an organization
3. Go to Settings → API to get your access token
4. Set up webhooks and get your webhook secret
5. Note your organization ID from the URL or settings

### 3. Database Migration

Run the Prisma migration to update your database schema:

```bash
npx prisma migrate dev --name add_polar_support
```

This will add:
- `polarCustomerId` field to Brand model
- `polarProductIdMonthly` and `polarProductIdYearly` fields to SubscriptionPlan model
- `polarSubscriptionId` and `polarProductId` fields to Subscription model
- `provider` enum field to Subscription model (STRIPE or POLAR)

### 4. Configure Webhooks

Set up a webhook endpoint in your Polar dashboard:

**Webhook URL**: `https://your-api-domain.com/api/subscriptions/webhook/polar`

**Events to subscribe to**:
- `subscription.created`
- `subscription.updated`
- `subscription.canceled`
- `subscription.active`
- `subscription.past_due`
- `checkout.completed`

## Usage

### Creating Subscription Plans

Subscription plans work with both providers. The system will automatically sync plans to the chosen provider when needed.

```javascript
// Create a plan (works with both Stripe and Polar)
const plan = await prisma.subscriptionPlan.create({
  data: {
    name: "Pro Plan",
    description: "Professional features",
    priceMonthly: 29.99,
    priceYearly: 299.99,
    currency: "USD",
    maxBranches: 5,
    maxStaff: 20,
    features: {
      analytics: true,
      advancedReporting: true,
      apiAccess: true
    }
  }
});
```

### Creating Subscriptions with Polar

When creating a subscription, specify `provider: "POLAR"`:

```javascript
// API Request
POST /api/subscriptions/brands/:brandId/subscribe

{
  "planId": "plan-uuid",
  "period": "monthly", // or "yearly"
  "provider": "POLAR"
}
```

### Creating Checkout Sessions

```javascript
// API Request
POST /api/subscriptions/brands/:brandId/checkout

{
  "planId": "plan-uuid",
  "period": "monthly",
  "successUrl": "https://your-app.com/success",
  "cancelUrl": "https://your-app.com/cancel",
  "provider": "POLAR"
}

// Response
{
  "data": {
    "id": "checkout-id",
    "url": "https://polar.sh/checkout/...",
    "status": "open"
  }
}
```

### Managing Subscriptions

#### Get Billing Portal

```javascript
// API Request
POST /api/subscriptions/brands/:brandId/billing-portal

{
  "returnUrl": "https://your-app.com/settings",
  "provider": "POLAR"
}

// Response
{
  "data": {
    "url": "https://polar.sh/portal?customer_id=..."
  }
}
```

#### Cancel Subscription

```javascript
// API Request
POST /api/subscriptions/brands/:brandId/cancel

{
  "immediate": false // Cancel at period end
}
```

#### Reactivate Subscription

```javascript
// API Request
POST /api/subscriptions/brands/:brandId/reactivate
```

#### Change Plan

```javascript
// API Request
POST /api/subscriptions/brands/:brandId/change-plan

{
  "newPlanId": "new-plan-uuid",
  "period": "yearly"
}
```

## API Endpoints

All subscription endpoints support the `provider` parameter to specify which payment provider to use.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscriptions/plans` | GET | List all subscription plans |
| `/api/subscriptions/brands/:brandId` | GET | Get brand subscription |
| `/api/subscriptions/brands/:brandId/subscribe` | POST | Subscribe brand (direct) |
| `/api/subscriptions/brands/:brandId/checkout` | POST | Create checkout session |
| `/api/subscriptions/brands/:brandId/billing-portal` | POST | Get billing portal URL |
| `/api/subscriptions/brands/:brandId/cancel` | POST | Cancel subscription |
| `/api/subscriptions/brands/:brandId/reactivate` | POST | Reactivate subscription |
| `/api/subscriptions/brands/:brandId/change-plan` | POST | Change subscription plan |
| `/api/subscriptions/webhook/polar` | POST | Polar webhook handler |

## Webhook Events

The Polar webhook handler automatically processes these events:

- **subscription.created**: Creates a new subscription in your database
- **subscription.updated**: Updates subscription status and period
- **subscription.canceled**: Marks subscription as canceled
- **subscription.active**: Activates a subscription
- **subscription.past_due**: Marks subscription as past due
- **checkout.completed**: Logs successful checkout completion

## Subscription Status Mapping

Polar statuses are mapped to your application's subscription statuses:

| Polar Status | App Status |
|--------------|------------|
| active | ACTIVE |
| trialing | TRIALING |
| past_due | PAST_DUE |
| canceled | CANCELED |
| unpaid | PAST_DUE |
| incomplete | PAST_DUE |

## Testing

### Testing in Development

1. Use Polar's test mode credentials
2. Set up a local webhook endpoint using tools like ngrok:
   ```bash
   ngrok http 9000
   ```
3. Update your Polar webhook URL to the ngrok URL

### Testing Webhooks Locally

You can manually trigger webhook events for testing:

```bash
curl -X POST http://localhost:9000/api/subscriptions/webhook/polar \
  -H "Content-Type: application/json" \
  -H "Polar-Signature: your-test-signature" \
  -d '{
    "type": "subscription.created",
    "data": {
      "id": "sub_123",
      "status": "active",
      "product_id": "prod_123",
      "current_period_end": "2025-11-28T00:00:00Z",
      "metadata": {
        "brandId": "brand-uuid"
      }
    }
  }'
```

## Migration from Stripe to Polar

If you want to migrate existing subscriptions from Stripe to Polar:

1. Export your subscription data
2. Create equivalent products in Polar
3. Update the subscription records in your database
4. Cancel old Stripe subscriptions
5. Create new Polar subscriptions

## Benefits of Using Polar

- **Developer-friendly**: Built specifically for software businesses
- **Simple pricing**: Transparent and predictable costs
- **Modern API**: Clean, well-documented API
- **Open source friendly**: Designed for open source projects
- **Quick integration**: Get started with just 6 lines of code

## Support

For Polar-specific issues:
- Polar Documentation: [https://docs.polar.sh](https://docs.polar.sh)
- Polar Support: [https://polar.sh/support](https://polar.sh/support)

For TrueTab API issues:
- Check the API logs
- Review webhook delivery logs in Polar dashboard
- Verify environment variables are set correctly
