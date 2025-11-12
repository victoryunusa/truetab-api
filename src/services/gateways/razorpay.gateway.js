const Razorpay = require("razorpay");

let razorpay = null;

function getRazorpay() {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const order = await getRazorpay().orders.create({
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
  const client = getRazorpay();
  const order = await client.orders.fetch(reference);
  const payments = await client.orders.fetchPayments(reference);

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
  const client = getRazorpay();
  // Get payment ID from order
  const payments = await client.orders.fetchPayments(reference);
  const paymentId = payments.items[0]?.id;

  if (!paymentId) {
    throw new Error("No payment found for order");
  }

  const refund = await client.payments.refund(paymentId, {
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
  const payout = await getRazorpay().payouts.create({
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
