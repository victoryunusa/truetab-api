const Stripe = require("stripe");

let stripe = null;

function getStripe() {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe credentials not configured");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const paymentIntent = await getStripe().paymentIntents.create({
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
  const paymentIntent = await getStripe().paymentIntents.retrieve(reference);
  
  return {
    reference: paymentIntent.id,
    status: paymentIntent.status === "succeeded" ? "success" : "failed",
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    metadata: paymentIntent.metadata,
  };
}

async function createRefund({ reference, amount, reason = null }) {
  const refund = await getStripe().refunds.create({
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
  const transfer = await getStripe().transfers.create({
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
  if (!webhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}

module.exports = {
  createPaymentIntent,
  verifyPayment,
  createRefund,
  initializePayout,
  verifyWebhook,
};
