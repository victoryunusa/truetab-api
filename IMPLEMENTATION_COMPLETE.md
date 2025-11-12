# Complete Implementation Guide - Payment Gateways & Routes

## Overview

This guide provides all the code you need to complete the online ordering and wallet system with multi-gateway support.

## Part 1: Payment Gateway Implementations

### File Structure
```
src/services/gateways/
├── stripe.gateway.js       (Existing - needs refactoring)
├── paystack.gateway.js     (NEW - Nigeria, Ghana, South Africa)
├── flutterwave.gateway.js  (NEW - Kenya, Uganda, Rwanda)
└── razorpay.gateway.js     (NEW - India)
```

### Gateway Interface (All gateways must implement this)

```javascript
{
  // Create payment intent/initialize transaction
  createPaymentIntent({ amount, currency, metadata })
  
  // Verify payment status
  verifyPayment(reference)
  
  // Create refund
  createRefund({ reference, amount, reason })
  
  // Initialize payout (optional)
  initializePayout({ amount, currency, bankAccount, reference })
  
  // Verify webhook signature
  verifyWebhook(payload, signature)
}
```

### 1. Stripe Gateway (Refactor existing)

**File**: `src/services/gateways/stripe.gateway.js`

```javascript
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: { enabled: true },
  });

  return {
    reference: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    status: paymentIntent.status,
  };
}

async function verifyPayment(reference) {
  const paymentIntent = await stripe.paymentIntents.retrieve(reference);
  
  return {
    reference: paymentIntent.id,
    status: paymentIntent.status === "succeeded" ? "success" : "failed",
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    metadata: paymentIntent.metadata,
  };
}

async function createRefund({ reference, amount, reason = null }) {
  const refund = await stripe.refunds.create({
    payment_intent: reference,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason: reason || "requested_by_customer",
  });

  return {
    reference: refund.id,
    status: refund.status,
    amount: refund.amount / 100,
  };
}

async function initializePayout({ amount, currency, bankAccount, reference }) {
  // Requires Stripe Connect setup
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    destination: bankAccount.stripeAccountId,
    metadata: { reference },
  });

  return {
    reference: transfer.id,
    status: transfer.status,
  };
}

function verifyWebhook(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

module.exports = {
  createPaymentIntent,
  verifyPayment,
  createRefund,
  initializePayout,
  verifyWebhook,
};
```

### 2. Paystack Gateway (Nigeria, Ghana, South Africa)

**File**: `src/services/gateways/paystack.gateway.js`

```javascript
const axios = require("axios");

const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const response = await paystackClient.post("/transaction/initialize", {
    amount: Math.round(amount * 100), // Kobo for NGN, pesewas for GHS, cents for ZAR
    currency: currency.toUpperCase(),
    metadata,
  });

  return {
    reference: response.data.data.reference,
    clientSecret: response.data.data.access_code,
    authorizationUrl: response.data.data.authorization_url,
    status: "pending",
  };
}

async function verifyPayment(reference) {
  const response = await paystackClient.get(`/transaction/verify/${reference}`);
  const data = response.data.data;

  return {
    reference: data.reference,
    status: data.status === "success" ? "success" : "failed",
    amount: data.amount / 100,
    currency: data.currency,
    metadata: data.metadata,
  };
}

async function createRefund({ reference, amount, reason = null }) {
  const response = await paystackClient.post("/refund", {
    transaction: reference,
    amount: amount ? Math.round(amount * 100) : undefined,
    merchant_note: reason,
  });

  return {
    reference: response.data.data.id,
    status: response.data.data.status,
    amount: response.data.data.amount / 100,
  };
}

async function initializePayout({ amount, currency, bankAccount, reference }) {
  // Create transfer recipient first
  const recipientResponse = await paystackClient.post("/transferrecipient", {
    type: "nuban",
    name: bankAccount.accountName,
    account_number: bankAccount.accountNumber,
    bank_code: bankAccount.bankCode,
    currency: currency.toUpperCase(),
  });

  const recipientCode = recipientResponse.data.data.recipient_code;

  // Initialize transfer
  const transferResponse = await paystackClient.post("/transfer", {
    source: "balance",
    amount: Math.round(amount * 100),
    recipient: recipientCode,
    reference,
    reason: `Payout for ${reference}`,
  });

  return {
    reference: transferResponse.data.data.transfer_code,
    status: transferResponse.data.data.status,
  };
}

function verifyWebhook(payload, signature) {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest("hex");

  if (hash !== signature) {
    throw new Error("Invalid webhook signature");
  }

  return payload;
}

module.exports = {
  createPaymentIntent,
  verifyPayment,
  createRefund,
  initializePayout,
  verifyWebhook,
};
```

### 3. Flutterwave Gateway (Kenya, Uganda, Rwanda)

**File**: `src/services/gateways/flutterwave.gateway.js`

```javascript
const axios = require("axios");

const flutterwaveClient = axios.create({
  baseURL: "https://api.flutterwave.com/v3",
  headers: {
    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const response = await flutterwaveClient.post("/payments", {
    amount,
    currency: currency.toUpperCase(),
    tx_ref: `tx-${Date.now()}`,
    meta: metadata,
  });

  return {
    reference: response.data.data.tx_ref,
    clientSecret: response.data.data.link,
    status: "pending",
  };
}

async function verifyPayment(reference) {
  const response = await flutterwaveClient.get(`/transactions/verify_by_reference?tx_ref=${reference}`);
  const data = response.data.data;

  return {
    reference: data.tx_ref,
    status: data.status === "successful" ? "success" : "failed",
    amount: data.amount,
    currency: data.currency,
    metadata: data.meta,
  };
}

async function createRefund({ reference, amount, reason = null }) {
  const response = await flutterwaveClient.post(`/transactions/${reference}/refund`, {
    amount: amount || undefined,
    comments: reason,
  });

  return {
    reference: response.data.data.id,
    status: response.data.data.status,
    amount: response.data.data.amount,
  };
}

async function initializePayout({ amount, currency, bankAccount, reference }) {
  const response = await flutterwaveClient.post("/transfers", {
    account_bank: bankAccount.bankCode,
    account_number: bankAccount.accountNumber,
    amount,
    currency: currency.toUpperCase(),
    reference,
    narration: `Payout ${reference}`,
    beneficiary_name: bankAccount.accountName,
  });

  return {
    reference: response.data.data.reference,
    status: response.data.data.status,
  };
}

function verifyWebhook(payload, signature) {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha256", process.env.FLUTTERWAVE_SECRET_HASH)
    .update(JSON.stringify(payload))
    .digest("hex");

  if (hash !== signature) {
    throw new Error("Invalid webhook signature");
  }

  return payload;
}

module.exports = {
  createPaymentIntent,
  verifyPayment,
  createRefund,
  initializePayout,
  verifyWebhook,
};
```

### 4. Razorpay Gateway (India)

**File**: `src/services/gateways/razorpay.gateway.js`

```javascript
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Paise for INR
    currency: currency.toUpperCase(),
    notes: metadata,
  });

  return {
    reference: order.id,
    clientSecret: order.id,
    status: "pending",
  };
}

async function verifyPayment(reference) {
  const order = await razorpay.orders.fetch(reference);
  const payments = await razorpay.orders.fetchPayments(reference);

  const payment = payments.items[0];

  return {
    reference: order.id,
    status: payment?.status === "captured" ? "success" : "failed",
    amount: order.amount / 100,
    currency: order.currency,
    metadata: order.notes,
  };
}

async function createRefund({ reference, amount, reason = null }) {
  // Get payment ID from order
  const payments = await razorpay.orders.fetchPayments(reference);
  const paymentId = payments.items[0]?.id;

  if (!paymentId) {
    throw new Error("No payment found for order");
  }

  const refund = await razorpay.payments.refund(paymentId, {
    amount: amount ? Math.round(amount * 100) : undefined,
    notes: { reason },
  });

  return {
    reference: refund.id,
    status: refund.status,
    amount: refund.amount / 100,
  };
}

async function initializePayout({ amount, currency, bankAccount, reference }) {
  const payout = await razorpay.payouts.create({
    account_number: bankAccount.accountNumber,
    fund_account_id: bankAccount.fundAccountId, // Pre-created fund account
    amount: Math.round(amount * 100),
    currency: currency.toUpperCase(),
    mode: "NEFT", // or 'IMPS', 'RTGS', 'UPI'
    purpose: "payout",
    reference_id: reference,
  });

  return {
    reference: payout.id,
    status: payout.status,
  };
}

function verifyWebhook(payload, signature) {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("Invalid webhook signature");
  }

  return payload;
}

module.exports = {
  createPaymentIntent,
  verifyPayment,
  createRefund,
  initializePayout,
  verifyWebhook,
};
```

## Part 2: Environment Variables

Add to `.env`:

```env
# Paystack (Nigeria, Ghana, South Africa)
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Flutterwave (Kenya, Uganda, Rwanda)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST...
FLUTTERWAVE_SECRET_HASH=...

# Razorpay (India)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

## Part 3: NPM Packages Needed

```bash
npm install razorpay
# axios already installed
```

## Next Steps

I'll now create the complete routes and controllers for:
1. Online Ordering (Menu, Cart, Checkout)
2. Wallet Management
3. Bank Accounts
4. Payouts
5. Unified Webhooks

Would you like me to continue with creating all the route handlers and controllers now?
