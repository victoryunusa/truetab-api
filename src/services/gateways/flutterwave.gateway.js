const axios = require("axios");

let flutterwaveClient = null;

function getFlutterwaveClient() {
  if (!flutterwaveClient) {
    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      throw new Error("Flutterwave credentials not configured");
    }
    flutterwaveClient = axios.create({
      baseURL: "https://api.flutterwave.com/v3",
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }
  return flutterwaveClient;
}

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const response = await getFlutterwaveClient().post("/payments", {
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
  const response = await getFlutterwaveClient().get(`/transactions/verify_by_reference?tx_ref=${reference}`);
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
  const response = await getFlutterwaveClient().post(`/transactions/${reference}/refund`, {
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
  const response = await getFlutterwaveClient().post("/transfers", {
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
  if (!process.env.FLUTTERWAVE_SECRET_HASH) {
    throw new Error("Flutterwave secret hash not configured");
  }
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
