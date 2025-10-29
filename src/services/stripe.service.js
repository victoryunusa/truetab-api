const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia", // Use the latest stable API version
});

/**
 * Create or retrieve a Stripe customer for a brand
 */
async function getOrCreateCustomer({ brandId, email, name, metadata = {} }) {
  // Check if customer already has a Stripe ID
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { stripeCustomerId: true },
  });

  if (brand?.stripeCustomerId) {
    return stripe.customers.retrieve(brand.stripeCustomerId);
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      brandId,
      ...metadata,
    },
  });

  // Store customer ID in database
  await prisma.brand.update({
    where: { id: brandId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
async function createCheckoutSession({
  customerId,
  priceId,
  brandId,
  successUrl,
  cancelUrl,
  trialPeriodDays = null,
}) {
  const sessionParams = {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      brandId,
    },
    subscription_data: {
      metadata: {
        brandId,
      },
    },
  };

  if (trialPeriodDays) {
    sessionParams.subscription_data.trial_period_days = trialPeriodDays;
  }

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a billing portal session for customer to manage subscription
 */
async function createBillingPortalSession({ customerId, returnUrl }) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Cancel a subscription
 */
async function cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
  if (cancelAtPeriodEnd) {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Reactivate a canceled subscription
 */
async function reactivateSubscription(subscriptionId) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription to a new price/plan
 */
async function updateSubscription({ subscriptionId, newPriceId }) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: "create_prorations", // Charge/credit difference
  });
}

/**
 * Retrieve subscription from Stripe
 */
async function getSubscription(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Create or sync a subscription plan product and prices in Stripe
 */
async function syncPlanToStripe({
  planId,
  name,
  description,
  priceMonthly,
  priceYearly,
  currency,
  features,
}) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  let productId = plan?.stripeProductId;
  let product;

  // Create or update product
  if (productId) {
    product = await stripe.products.update(productId, {
      name,
      description,
      metadata: {
        planId,
        features: JSON.stringify(features),
      },
    });
  } else {
    product = await stripe.products.create({
      name,
      description,
      metadata: {
        planId,
        features: JSON.stringify(features),
      },
    });
    productId = product.id;
  }

  // Create or update monthly price
  let monthlyPriceId = plan?.stripePriceIdMonthly;
  if (!monthlyPriceId) {
    const monthlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(priceMonthly * 100), // Convert to cents
      currency: currency.toLowerCase(),
      recurring: {
        interval: "month",
      },
      metadata: {
        planId,
        period: "monthly",
      },
    });
    monthlyPriceId = monthlyPrice.id;
  }

  // Create or update yearly price
  let yearlyPriceId = plan?.stripePriceIdYearly;
  if (!yearlyPriceId) {
    const yearlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(priceYearly * 100), // Convert to cents
      currency: currency.toLowerCase(),
      recurring: {
        interval: "year",
      },
      metadata: {
        planId,
        period: "yearly",
      },
    });
    yearlyPriceId = yearlyPrice.id;
  }

  // Update database with Stripe IDs
  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      stripeProductId: productId,
      stripePriceIdMonthly: monthlyPriceId,
      stripePriceIdYearly: yearlyPriceId,
    },
  });

  return {
    productId,
    monthlyPriceId,
    yearlyPriceId,
  };
}

/**
 * Construct webhook event from raw body and signature
 */
function constructWebhookEvent(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

module.exports = {
  stripe,
  getOrCreateCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
  updateSubscription,
  getSubscription,
  syncPlanToStripe,
  constructWebhookEvent,
};
