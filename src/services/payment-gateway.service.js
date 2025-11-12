const stripe = require("./gateways/stripe.gateway");
const paystack = require("./gateways/paystack.gateway");
const flutterwave = require("./gateways/flutterwave.gateway");
const razorpay = require("./gateways/razorpay.gateway");

/**
 * Payment Gateway Factory
 * Provides unified interface for multiple payment providers
 */

const GATEWAYS = {
  stripe,
  paystack,
  flutterwave,
  razorpay,
};

// Country to default gateway mapping
const COUNTRY_GATEWAY_MAP = {
  US: "stripe",
  CA: "stripe",
  GB: "stripe",
  EU: "stripe",
  NG: "paystack", // Nigeria
  GH: "paystack", // Ghana
  ZA: "paystack", // South Africa
  KE: "flutterwave", // Kenya
  UG: "flutterwave", // Uganda
  IN: "razorpay", // India
};

/**
 * Get payment gateway instance
 */
function getGateway(gatewayName) {
  const gateway = GATEWAYS[gatewayName.toLowerCase()];
  if (!gateway) {
    throw new Error(`Payment gateway ${gatewayName} not supported`);
  }
  return gateway;
}

/**
 * Get default gateway for country
 */
function getGatewayForCountry(countryCode) {
  const gatewayName = COUNTRY_GATEWAY_MAP[countryCode.toUpperCase()] || "stripe";
  return getGateway(gatewayName);
}

/**
 * Get configured gateway for brand
 */
async function getGatewayForBrand(brandId) {
  const prisma = require("../lib/prisma");
  
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: {
      defaultGateway: true,
      paymentGateways: true,
      country: {
        select: { code: true },
      },
    },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  // Use brand's default gateway if set
  if (brand.defaultGateway) {
    return {
      gateway: getGateway(brand.defaultGateway),
      name: brand.defaultGateway,
      config: brand.paymentGateways?.[brand.defaultGateway],
    };
  }

  // Fall back to country default
  const countryCode = brand.country?.code || "US";
  const gatewayName = COUNTRY_GATEWAY_MAP[countryCode] || "stripe";
  
  return {
    gateway: getGateway(gatewayName),
    name: gatewayName,
    config: brand.paymentGateways?.[gatewayName],
  };
}

/**
 * Create payment intent
 */
async function createPaymentIntent({
  brandId,
  amount,
  currency,
  metadata = {},
  gatewayName = null,
}) {
  let gatewayInfo;
  
  if (gatewayName) {
    gatewayInfo = {
      gateway: getGateway(gatewayName),
      name: gatewayName,
    };
  } else {
    gatewayInfo = await getGatewayForBrand(brandId);
  }

  const result = await gatewayInfo.gateway.createPaymentIntent({
    amount,
    currency,
    metadata: {
      ...metadata,
      brandId,
      gateway: gatewayInfo.name,
    },
  });

  return {
    ...result,
    gateway: gatewayInfo.name,
  };
}

/**
 * Verify payment
 */
async function verifyPayment({ reference, gatewayName }) {
  const gateway = getGateway(gatewayName);
  return gateway.verifyPayment(reference);
}

/**
 * Create refund
 */
async function createRefund({ reference, amount, gatewayName, reason = null }) {
  const gateway = getGateway(gatewayName);
  return gateway.createRefund({ reference, amount, reason });
}

/**
 * Initialize payout
 */
async function initializePayout({
  gatewayName,
  amount,
  currency,
  bankAccount,
  reference,
}) {
  const gateway = getGateway(gatewayName);
  
  if (!gateway.initializePayout) {
    throw new Error(`Gateway ${gatewayName} does not support payouts`);
  }

  return gateway.initializePayout({
    amount,
    currency,
    bankAccount,
    reference,
  });
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature({ payload, signature, gatewayName }) {
  const gateway = getGateway(gatewayName);
  return gateway.verifyWebhook(payload, signature);
}

/**
 * Get supported gateways
 */
function getSupportedGateways() {
  return Object.keys(GATEWAYS);
}

/**
 * Check if gateway is available
 */
function isGatewayAvailable(gatewayName) {
  return GATEWAYS.hasOwnProperty(gatewayName.toLowerCase());
}

module.exports = {
  getGateway,
  getGatewayForCountry,
  getGatewayForBrand,
  createPaymentIntent,
  verifyPayment,
  createRefund,
  initializePayout,
  verifyWebhookSignature,
  getSupportedGateways,
  isGatewayAvailable,
  COUNTRY_GATEWAY_MAP,
};
