# Marketing Campaign Feature

A comprehensive marketing campaign management system to help brands promote themselves through various channels.

## Overview

The marketing feature enables restaurants and brands to:
- Create and manage marketing campaigns across multiple channels
- Target specific customer segments
- Track campaign performance and engagement
- Measure ROI and conversion rates
- Build and manage campaign audiences

## Database Schema

### Campaign Model
The main campaign entity containing all campaign details:
- **Basic Info**: Name, description, type, channel
- **Status**: DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, CANCELLED
- **Timing**: Start date, end date, budget
- **Content**: JSON field for flexible content (email body, SMS text, etc.)
- **Targeting**: Audience criteria, promo codes, call-to-action

### Campaign Types
- `PROMOTIONAL` - Discounts and special offers
- `ANNOUNCEMENT` - New menu items or events
- `LOYALTY_REWARD` - Loyalty program promotions
- `SEASONAL` - Holiday and seasonal campaigns
- `BRAND_AWARENESS` - General brand promotion
- `RE_ENGAGEMENT` - Win back inactive customers
- `PRODUCT_LAUNCH` - New product introductions
- `FEEDBACK` - Request reviews or feedback

### Campaign Channels
- `EMAIL` - Email marketing
- `SMS` - Text message campaigns
- `PUSH` - Push notifications
- `IN_APP` - In-app messages
- `SOCIAL_MEDIA` - Social media posts
- `QR_CODE` - QR code campaigns
- `WEBSITE_BANNER` - Website banner ads

### CampaignAudience Model
Tracks individual recipients of a campaign:
- Customer or email/phone reference
- Delivery status (sent, delivered, opened, clicked, converted)
- Segment criteria (how they were selected)
- Unsubscribe tracking

### CampaignMetrics Model
Aggregated campaign performance metrics:
- Total sent, delivered, opened, clicked, converted
- Unique opens and clicks
- Bounce rate, conversion rate, ROI
- Total revenue generated

### CampaignEngagement Model
Individual engagement events for detailed tracking:
- Event types: SENT, DELIVERED, OPENED, CLICKED, CONVERTED, BOUNCED, UNSUBSCRIBED
- Customer/email reference
- IP address, user agent for tracking
- Custom event data

## API Endpoints

### Campaign Management

#### Create Campaign
```http
POST /api/marketing/campaigns
Authorization: Bearer <token>
X-Brand-ID: <brand-id>

{
  "name": "Summer Sale 2024",
  "description": "20% off all items",
  "type": "PROMOTIONAL",
  "channel": "EMAIL",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-30T23:59:59Z",
  "budget": 500.00,
  "content": {
    "subject": "Summer Sale - 20% Off!",
    "body": "Enjoy 20% off all menu items this June...",
    "htmlBody": "<html>...</html>"
  },
  "imageUrl": "https://example.com/banner.jpg",
  "callToAction": "Order Now",
  "link": "https://restaurant.com/menu",
  "promoCode": "SUMMER20"
}
```

#### List Campaigns
```http
GET /api/marketing/campaigns?page=1&limit=20&status=ACTIVE&type=PROMOTIONAL
Authorization: Bearer <token>
X-Brand-ID: <brand-id>
```

#### Get Campaign Details
```http
GET /api/marketing/campaigns/:id
Authorization: Bearer <token>
X-Brand-ID: <brand-id>
```

#### Update Campaign
```http
PUT /api/marketing/campaigns/:id
Authorization: Bearer <token>
X-Brand-ID: <brand-id>

{
  "status": "ACTIVE",
  "budget": 750.00
}
```

#### Delete Campaign
```http
DELETE /api/marketing/campaigns/:id
Authorization: Bearer <token>
X-Brand-ID: <brand-id>
```

### Audience Management

#### Add Audience to Campaign
```http
POST /api/marketing/campaigns/:id/audience
Authorization: Bearer <token>
X-Brand-ID: <brand-id>

{
  "customers": ["customer-id-1", "customer-id-2"],
  "segments": {
    "newCustomers": true,
    "lastOrderDays": 30
  },
  "emails": ["john@example.com", "jane@example.com"],
  "phones": ["+1234567890"]
}
```

#### Get Campaign Audience
```http
GET /api/marketing/campaigns/:id/audience?page=1&limit=50
Authorization: Bearer <token>
X-Brand-ID: <brand-id>
```

### Analytics & Tracking

#### Get Campaign Analytics
```http
GET /api/marketing/campaigns/:id/analytics
Authorization: Bearer <token>
X-Brand-ID: <brand-id>

Response:
{
  "data": {
    "campaign": {
      "id": "campaign-id",
      "name": "Summer Sale 2024",
      "type": "PROMOTIONAL",
      "channel": "EMAIL",
      "status": "ACTIVE"
    },
    "metrics": {
      "totalAudience": 1000,
      "totalSent": 950,
      "totalDelivered": 920,
      "totalOpened": 450,
      "totalClicked": 180,
      "totalConverted": 45,
      "totalUnsubscribed": 5,
      "totalRevenue": 2250.00,
      "openRate": "48.91",
      "clickRate": "40.00",
      "conversionRate": "25.00",
      "roi": 3.5
    }
  }
}
```

#### Track Campaign Engagement
```http
POST /api/marketing/campaigns/:id/track

{
  "eventType": "OPENED",
  "email": "customer@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## Usage Examples

### Example 1: Creating an Email Campaign

```javascript
const campaign = await fetch('/api/marketing/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'X-Brand-ID': 'YOUR_BRAND_ID',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Weekend Special",
    type: "PROMOTIONAL",
    channel: "EMAIL",
    content: {
      subject: "This Weekend Only: 25% Off",
      body: "Visit us this weekend and enjoy 25% off your entire order!",
      htmlBody: "<html><body><h1>Weekend Special</h1>...</body></html>"
    },
    promoCode: "WEEKEND25",
    startDate: "2024-06-15T00:00:00Z",
    endDate: "2024-06-17T23:59:59Z"
  })
});
```

### Example 2: Segmenting Customers

```javascript
// Add new customers from the last 30 days
await fetch(`/api/marketing/campaigns/${campaignId}/audience`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'X-Brand-ID': 'YOUR_BRAND_ID',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    segments: {
      newCustomers: true,
      lastOrderDays: 30
    }
  })
});
```

### Example 3: Tracking Email Opens

```javascript
// In your email template, add a tracking pixel:
// <img src="https://api.yourapp.com/api/marketing/campaigns/CAMPAIGN_ID/track?event=OPENED&email=customer@example.com" width="1" height="1" />

// Or use a webhook when your email service provider fires events
await fetch(`/api/marketing/campaigns/${campaignId}/track`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventType: "CLICKED",
    email: "customer@example.com",
    eventData: {
      link: "https://restaurant.com/menu",
      timestamp: new Date().toISOString()
    }
  })
});
```

## Features

### ✅ Campaign Management
- Create, read, update, delete campaigns
- Support for multiple campaign types and channels
- Campaign status workflow (Draft → Scheduled → Active → Completed)
- Budget tracking
- Content management with flexible JSON structure

### ✅ Audience Targeting
- Target by customer IDs
- Target by customer segments (new customers, loyalty tiers, spending levels)
- Direct email/phone list uploads
- Automatic customer discovery based on criteria

### ✅ Analytics & Metrics
- Real-time engagement tracking
- Open rates, click rates, conversion rates
- Revenue attribution
- ROI calculation
- Detailed engagement history

### ✅ Multi-Channel Support
- Email campaigns
- SMS campaigns
- Push notifications
- In-app messages
- Social media posts
- QR code campaigns
- Website banners

## Best Practices

### 1. Campaign Planning
- Define clear goals before creating a campaign
- Set appropriate start and end dates
- Allocate a realistic budget
- Create compelling content with clear CTAs

### 2. Audience Segmentation
- Start with small, targeted segments
- Test different audience criteria
- Avoid over-targeting the same customers
- Respect unsubscribe preferences

### 3. Content Creation
- Use clear, concise subject lines (for emails)
- Include a strong call-to-action
- Mobile-optimize all content
- Test content before sending

### 4. Performance Monitoring
- Check campaign metrics regularly
- A/B test different approaches
- Monitor unsubscribe rates
- Track ROI for budget optimization

### 5. Compliance
- Always include unsubscribe options
- Honor opt-out requests immediately
- Follow email marketing regulations (CAN-SPAM, GDPR)
- Protect customer data

## Integration Points

### Email Service Providers
Integrate with services like:
- SendGrid
- Mailchimp
- AWS SES
- Resend (already in package.json)

### SMS Providers
- Twilio
- MessageBird
- AWS SNS

### Analytics
- Track conversion by linking with order data
- Calculate revenue attribution automatically
- Export metrics for external analysis

## Security & Permissions

- Requires active subscription
- Only accessible by SUPER_ADMIN, BRAND_OWNER, BRAND_ADMIN roles
- Brand-scoped - campaigns are isolated per brand
- Public tracking endpoint for external webhooks

## Future Enhancements

- [ ] A/B testing support
- [ ] Scheduled campaign sending
- [ ] Email template library
- [ ] SMS template library
- [ ] Campaign automation workflows
- [ ] Advanced segmentation with ML
- [ ] Social media integration (Facebook, Instagram)
- [ ] Campaign duplication
- [ ] Campaign reporting exports (PDF, CSV)
- [ ] Predictive analytics for optimal send times

## Technical Notes

- All dates are stored in UTC
- Metrics are updated in real-time via engagement tracking
- Audience deduplication is handled automatically
- Soft deletes maintain campaign history
- Campaign status prevents accidental modifications to active campaigns

## Support

For questions or issues with the marketing feature, please contact the development team or create an issue in the repository.
