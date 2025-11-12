const axios = require("axios");

let paystackClient = null;

function getPaystackClient() {
  if (!paystackClient) {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      throw new Error("Paystack credentials not configured");
    }
    paystackClient = axios.create({
      baseURL: "https://api.paystack.co",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
  }
  return paystackClient;
}

async function createPaymentIntent({ amount, currency, metadata = {} }) {
  const response = await getPaystackClient().post("/transaction/initialize", {
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
  const response = await getPaystackClient().get(`/transaction/verify/${reference}`);
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
  const response = await getPaystackClient().post("/refund", {
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
  const client = getPaystackClient();
  // Create transfer recipient first
  const recipientResponse = await client.post("/transferrecipient", {
    type: "nuban",
    name: bankAccount.accountName,
    account_number: bankAccount.accountNumber,
    bank_code: bankAccount.bankCode,
    currency: currency.toUpperCase(),
  });

  const recipientCode = recipientResponse.data.data.recipient_code;

  // Initialize transfer
  const transferResponse = await client.post("/transfer", {
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
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
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
