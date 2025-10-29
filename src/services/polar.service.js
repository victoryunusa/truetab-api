const axios = require('axios');

let polarApi = null;

if (process.env.POLAR_ACCESS_TOKEN) {
  // Polar uses different auth header format
  const token = process.env.POLAR_ACCESS_TOKEN;
  // Remove 'polar_oat_' prefix if present for the Bearer token
  const cleanToken = token.startsWith('polar_') ? token : token;

  polarApi = axios.create({
    baseURL: 'https://sandbox-api.polar.sh/api/v1',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Add response interceptor for better error handling
  polarApi.interceptors.response.use(
    response => response,
    error => {
      if (error.response) {
        const msg = error.response.data?.detail || error.response.data?.error || error.message;
        console.error(`Polar API Error (${error.response.status}):`, msg);
        throw new Error(`Polar API: ${msg}`);
      }
      throw error;
    }
  );
}

function ensurePolarConfigured() {
  if (!polarApi) {
    throw new Error(
      'POLAR_ACCESS_TOKEN is not configured. Please add it to your environment variables.'
    );
  }
}

/**
 * Create or retrieve a Polar customer for a brand
 */
async function getOrCreateCustomer({ brandId, email, name, metadata = {} }) {
  ensurePolarConfigured();
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { polarCustomerId: true },
  });

  if (brand?.polarCustomerId) {
    const response = await polarApi.get(`/customers/${brand.polarCustomerId}`);
    return response.data;
  }

  // Create new Polar customer
  const response = await polarApi.post('/customers', {
    email,
    name,
    metadata: {
      brandId,
      ...metadata,
    },
  });

  const customer = response.data;

  // Store customer ID in database
  await prisma.brand.update({
    where: { id: brandId },
    data: { polarCustomerId: customer.id },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
async function createCheckoutSession({ customerId, productPriceId, brandId, successUrl }) {
  ensurePolarConfigured();

  // Polar checkout creation
  const response = await polarApi.post('/checkouts', {
    product_price_id: productPriceId,
    customer_id: customerId,
    success_url: successUrl,
    customer_metadata: {
      brandId,
    },
  });

  return response.data;
}

/**
 * Get customer portal URL for subscription management
 */
async function getCustomerPortalUrl({ customerId }) {
  // Polar provides a customer portal at a standard URL
  return `https://polar.sh/portal?customer_id=${customerId}`;
}

/**
 * Cancel a subscription
 */
async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  ensurePolarConfigured();
  const endpoint = cancelAtPeriodEnd
    ? `/subscriptions/${subscriptionId}/cancel`
    : `/subscriptions/${subscriptionId}`;

  const response = await polarApi.post(endpoint);
  return response.data;
}

/**
 * Reactivate a canceled subscription
 */
async function reactivateSubscription(subscriptionId) {
  ensurePolarConfigured();
  const response = await polarApi.post(`/subscriptions/${subscriptionId}/reactivate`);
  return response.data;
}

/**
 * Update subscription to a new product/price
 */
async function updateSubscription({ subscriptionId, newProductPriceId }) {
  ensurePolarConfigured();
  const response = await polarApi.patch(`/subscriptions/${subscriptionId}`, {
    product_price_id: newProductPriceId,
  });
  return response.data;
}

/**
 * Retrieve subscription from Polar
 */
async function getSubscription(subscriptionId) {
  ensurePolarConfigured();
  const response = await polarApi.get(`/subscriptions/${subscriptionId}`);
  return response.data;
}

/**
 * Create or sync a subscription product and prices in Polar
 */
async function syncProductToPolar({
  planId,
  name,
  description,
  priceMonthly,
  priceYearly,
  currency,
  features,
  organizationId,
}) {
  ensurePolarConfigured();
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  // Create monthly product with price
  let monthlyProductId = plan?.polarProductIdMonthly;
  
  // Check if the price actually exists in Polar
  let monthlyPriceExists = false;
  if (monthlyProductId) {
    try {
      await polarApi.get(`/products/prices/${monthlyProductId}`);
      monthlyPriceExists = true;
    } catch (error) {
      console.log(`Monthly price ${monthlyProductId} not found in Polar, will create new one`);
      monthlyProductId = null;
    }
  }
  
  if (!monthlyProductId) {
    // Create product with price in one call
    const productResponse = await polarApi.post("/products", {
      name: `${name} - Monthly`,
      description,
      is_recurring: true,
      recurring_interval: "month",
      prices: [
        {
          amount_type: "fixed",
          type: "recurring",
          recurring_interval: "month",
          price_amount: Math.round(priceMonthly * 100),
          price_currency: currency.toLowerCase(),
        },
      ],
    });
    
    // Get the price ID from the created product
    monthlyProductId = productResponse.data.prices[0].id;
  }

  // Create yearly product with price
  let yearlyProductId = plan?.polarProductIdYearly;
  
  // Check if the price actually exists in Polar
  let yearlyPriceExists = false;
  if (yearlyProductId) {
    try {
      await polarApi.get(`/products/prices/${yearlyProductId}`);
      yearlyPriceExists = true;
    } catch (error) {
      console.log(`Yearly price ${yearlyProductId} not found in Polar, will create new one`);
      yearlyProductId = null;
    }
  }
  
  if (!yearlyProductId) {
    // Create product with price in one call
    const productResponse = await polarApi.post("/products", {
      name: `${name} - Yearly`,
      description,
      is_recurring: true,
      recurring_interval: "year",
      prices: [
        {
          amount_type: "fixed",
          type: "recurring",
          recurring_interval: "year",
          price_amount: Math.round(priceYearly * 100),
          price_currency: currency.toLowerCase(),
        },
      ],
    });
    
    // Get the price ID from the created product
    yearlyProductId = productResponse.data.prices[0].id;
  }

  // Update database with Polar IDs
  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      polarProductIdMonthly: monthlyProductId,
      polarProductIdYearly: yearlyProductId,
    },
  });

  return {
    monthlyProductId,
    yearlyProductId,
  };
}

/**
 * Verify webhook signature
 * @param {string} rawBody - The raw request body as a string
 * @param {string} signature - The signature from the polar-signature header
 */
function verifyWebhookSignature(rawBody, signature) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('POLAR_WEBHOOK_SECRET is not defined');
  }

  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * List all products for an organization
 */
async function listProducts(organizationId) {
  ensurePolarConfigured();
  const response = await polarApi.get('/products', {
    params: { organization_id: organizationId },
  });
  return response.data;
}

module.exports = {
  polarApi,
  getOrCreateCustomer,
  createCheckoutSession,
  getCustomerPortalUrl,
  cancelSubscription,
  reactivateSubscription,
  updateSubscription,
  getSubscription,
  syncProductToPolar,
  verifyWebhookSignature,
  listProducts,
};
