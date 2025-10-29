# Subscription Invoicing System

## Overview

The subscription invoicing system automatically tracks all payments made by brands and provides detailed invoice records with downloadable invoices.

## Features

✅ **Automatic Invoice Creation** - Invoices are auto-generated when payments succeed  
✅ **Both Providers Supported** - Works with Stripe and Polar.sh  
✅ **Unique Invoice Numbers** - Sequential invoice numbers (e.g., INV-2025-0001)  
✅ **Payment History** - Complete history of all payments  
✅ **Payment Summary** - Dashboard with totals and statistics  
✅ **PDF Ready** - Structure ready for PDF generation  

---

## Database Schema

### SubscriptionInvoice Model

```prisma
model SubscriptionInvoice {
  id             String        @id @default(uuid())
  invoiceNumber  String        @unique        // e.g., INV-2025-0001
  subscriptionId String
  brandId        String
  
  // Invoice details
  amount         Float
  currency       String
  status         InvoiceStatus  // PENDING, PAID, FAILED, REFUNDED, VOID
  period         String         // "monthly" or "yearly"
  billingPeriod  String         // e.g., "January 2025" or "2025"
  
  // Dates
  periodStart    DateTime
  periodEnd      DateTime
  dueDate        DateTime?
  paidAt         DateTime?
  
  // Payment provider details
  provider               PaymentProvider
  stripeInvoiceId        String? @unique
  stripePaymentIntentId  String?
  polarInvoiceId         String? @unique
  polarPaymentId         String?
  
  // Invoice metadata
  lineItems      Json          // Array of items
  taxAmount      Float
  discountAmount Float
  totalAmount    Float          // amount + tax - discount
  
  // Invoice document
  invoiceUrl     String?        // URL to PDF invoice
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## API Endpoints

### Base URL: `/api/subscription`

### 1. Get Brand Invoices

**GET** `/brands/:brandId/invoices`

Get all invoices for a specific brand with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "id": "invoice-uuid",
      "invoiceNumber": "INV-2025-0001",
      "amount": 29.00,
      "currency": "USD",
      "status": "PAID",
      "period": "monthly",
      "billingPeriod": "January 2025",
      "periodStart": "2025-01-01T00:00:00Z",
      "periodEnd": "2025-02-01T00:00:00Z",
      "paidAt": "2025-01-01T10:30:00Z",
      "provider": "POLAR",
      "totalAmount": 29.00,
      "subscription": {
        "id": "subscription-uuid",
        "plan": {
          "id": "plan-uuid",
          "name": "Basic Plan"
        }
      },
      "createdAt": "2025-01-01T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 2. Get Payment Summary

**GET** `/brands/:brandId/payment-summary`

Get payment statistics and summary for a brand.

**Response:**
```json
{
  "data": {
    "totalPaid": 145.00,
    "totalPending": 0,
    "totalFailed": 0,
    "invoiceCount": 5,
    "paidInvoices": 5,
    "pendingInvoices": 0,
    "failedInvoices": 0,
    "lastPaymentDate": "2025-10-01T10:30:00Z",
    "lastPaymentAmount": 29.00
  }
}
```

---

### 3. Get Invoice by ID

**GET** `/invoices/:invoiceId`

Get a single invoice by its ID.

**Response:**
```json
{
  "data": {
    "id": "invoice-uuid",
    "invoiceNumber": "INV-2025-0001",
    "amount": 29.00,
    "currency": "USD",
    "status": "PAID",
    "period": "monthly",
    "billingPeriod": "January 2025",
    "periodStart": "2025-01-01T00:00:00Z",
    "periodEnd": "2025-02-01T00:00:00Z",
    "paidAt": "2025-01-01T10:30:00Z",
    "provider": "POLAR",
    "lineItems": [
      {
        "description": "Basic Plan - Monthly Subscription",
        "period": "Jan 01, 2025 - Feb 01, 2025",
        "quantity": 1,
        "unitPrice": 29.00,
        "amount": 29.00
      }
    ],
    "taxAmount": 0,
    "discountAmount": 0,
    "totalAmount": 29.00,
    "subscription": {
      "id": "subscription-uuid",
      "plan": {
        "id": "plan-uuid",
        "name": "Basic Plan"
      },
      "brand": {
        "id": "brand-uuid",
        "name": "My Restaurant",
        "email": "owner@restaurant.com"
      }
    }
  }
}
```

---

### 4. Get Invoice by Number

**GET** `/invoices/number/:invoiceNumber`

Get an invoice by its invoice number (e.g., INV-2025-0001).

**Response:** Same as Get Invoice by ID

---

### 5. Download Invoice

**GET** `/invoices/:invoiceId/download`

Get invoice data formatted for PDF generation.

**Response:**
```json
{
  "data": {
    "id": "invoice-uuid",
    "invoiceNumber": "INV-2025-0001",
    "amount": 29.00,
    // ... all invoice fields
    "companyDetails": {
      "name": "TrueTab",
      "address": "Your Company Address",
      "email": "billing@truetab.com",
      "website": "https://truetab.com"
    }
  }
}
```

---

## Automatic Invoice Creation

Invoices are automatically created when:

### Stripe
- Event: `invoice.payment_succeeded` or `invoice.paid`
- Triggered when a subscription payment is successful
- Creates invoice with Stripe invoice ID and payment intent ID

### Polar
- Event: `subscription.payment_succeeded`
- Triggered when a subscription payment is successful
- Creates invoice with Polar invoice ID and payment ID

---

## Invoice Number Format

Format: `INV-{YEAR}-{NUMBER}`

Examples:
- `INV-2025-0001`
- `INV-2025-0002`
- `INV-2025-0123`

Numbers are:
- **Sequential**: Increment for each invoice in a year
- **Zero-padded**: Always 4 digits
- **Year-based**: Reset each year

---

## Invoice Line Items

Each invoice contains structured line items:

```json
{
  "lineItems": [
    {
      "description": "Basic Plan - Monthly Subscription",
      "period": "Jan 01, 2025 - Feb 01, 2025",
      "quantity": 1,
      "unitPrice": 29.00,
      "amount": 29.00
    }
  ]
}
```

---

## Invoice Status

| Status | Description |
|--------|-------------|
| `PENDING` | Invoice created but not paid yet |
| `PAID` | Invoice successfully paid |
| `FAILED` | Payment attempt failed |
| `REFUNDED` | Payment was refunded |
| `VOID` | Invoice was voided/cancelled |

---

## Usage Examples

### Get All Invoices for a Brand

```bash
GET /api/subscription/brands/{brandId}/invoices?page=1&limit=10
Authorization: Bearer {token}
```

### Get Payment Summary

```bash
GET /api/subscription/brands/{brandId}/payment-summary
Authorization: Bearer {token}
```

### Get Specific Invoice

```bash
GET /api/subscription/invoices/{invoiceId}
Authorization: Bearer {token}
```

### Download Invoice

```bash
GET /api/subscription/invoices/{invoiceId}/download
Authorization: Bearer {token}
```

---

## Frontend Integration

### Display Invoice List

```javascript
const response = await fetch('/api/subscription/brands/brand-id/invoices', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data, pagination } = await response.json();

// Display invoices in a table
data.forEach(invoice => {
  console.log(invoice.invoiceNumber, invoice.totalAmount, invoice.status);
});
```

### Display Payment Summary Dashboard

```javascript
const response = await fetch('/api/subscription/brands/brand-id/payment-summary', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();

console.log(`Total Paid: $${data.totalPaid}`);
console.log(`Total Invoices: ${data.invoiceCount}`);
console.log(`Last Payment: $${data.lastPaymentAmount}`);
```

---

## PDF Generation (Future Enhancement)

The system is structured to support PDF invoice generation. To implement:

1. **Install PDF Library**
   ```bash
   npm install pdfkit
   # or
   npm install puppeteer
   ```

2. **Update `downloadInvoicePDF` in invoice.service.js**
   - Generate PDF using invoice data
   - Upload to cloud storage (Cloudinary/S3)
   - Return PDF URL

3. **Frontend Display**
   - Show download button
   - Open PDF in new tab or download directly

---

## Security & Access Control

All invoice endpoints require:
- ✅ **Authentication**: Valid JWT token
- ✅ **Authorization**: SUPER_ADMIN, BRAND_OWNER, or BRAND_ADMIN roles
- ✅ **Brand Isolation**: Users can only access invoices for their own brand

---

## Testing

### Test Invoice Creation

1. Create a test subscription
2. Trigger a payment (via Stripe/Polar webhook)
3. Check invoice was created:
   ```bash
   GET /api/subscription/brands/{brandId}/invoices
   ```

### Test Webhook Integration

**Stripe:**
```bash
stripe trigger invoice.payment_succeeded
```

**Polar:**
Use Polar dashboard to trigger test webhook

---

## Troubleshooting

### No Invoices Created

**Check:**
1. Webhooks are configured correctly
2. Webhook signature verification passes
3. Subscription has correct metadata (brandId)
4. Check server logs for errors

### Invoice Missing Data

**Check:**
1. Payment provider webhook includes all required fields
2. Subscription includes plan and brand relations
3. Line items are properly formatted

---

## Files

- **Service**: `src/modules/subscriptions/invoice.service.js`
- **Controller**: `src/modules/subscriptions/invoice.controller.js`
- **Routes**: `src/modules/subscriptions/subscription.routes.js`
- **Webhooks**: 
  - `src/modules/subscriptions/webhook.controller.js` (Stripe)
  - `src/modules/subscriptions/polar-webhook.controller.js` (Polar)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: October 29, 2025
