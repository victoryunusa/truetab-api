const { PrismaClient, SubscriptionStatus, PaymentProvider } = require("@prisma/client");
const dayjs = require("dayjs");
const stripeService = require("../../services/stripe.service");
const polarService = require("../../services/polar.service");
const prisma = new PrismaClient();

async function listPlans({ country }) {
  // country filtering optional; add a country field later if needed
  return prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } });
}

async function subscribeBrand({ brandId, planId, period, provider = "STRIPE" }) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan) throw new Error("Plan not found");

  const useStripe = provider === "STRIPE";
  const usePolar = provider === "POLAR";

  // Ensure plan is synced with the chosen provider
  if (useStripe && (!plan.stripePriceIdMonthly || !plan.stripePriceIdYearly)) {
    await stripeService.syncPlanToStripe({
      planId: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      features: plan.features,
    });
    // Refetch plan with updated Stripe IDs
    const updatedPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    Object.assign(plan, updatedPlan);
  } else if (usePolar && (!plan.polarProductIdMonthly || !plan.polarProductIdYearly)) {
    await polarService.syncProductToPolar({
      planId: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      features: plan.features,
      organizationId: process.env.POLAR_ORGANIZATION_ID,
    });
    // Refetch plan with updated Polar IDs
    const updatedPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    Object.assign(plan, updatedPlan);
  }

  // Get brand details
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { owner: { select: { email: true } } },
  });
  if (!brand) throw new Error("Brand not found");

  const months = period === "yearly" ? 12 : 1;
  const currentPeriodEnd = dayjs().add(months, "month").toDate();

  let customer, priceId, productId, sub;

  if (useStripe) {
    // Create or get Stripe customer
    customer = await stripeService.getOrCreateCustomer({
      brandId,
      email: brand.email || brand.owner.email,
      name: brand.name,
    });

    priceId = period === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    sub = await prisma.subscription.upsert({
      where: { brandId },
      update: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
        trialEndsAt: null,
        stripePriceId: priceId,
        provider: PaymentProvider.STRIPE,
      },
      create: {
        brandId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
        trialEndsAt: null,
        stripePriceId: priceId,
        provider: PaymentProvider.STRIPE,
      },
      include: { plan: true },
    });

    return { data: sub, customerId: customer.id, priceId };
  } else {
    // Create or get Polar customer
    customer = await polarService.getOrCreateCustomer({
      brandId,
      email: brand.email || brand.owner.email,
      name: brand.name,
    });

    productId = period === "yearly" ? plan.polarProductIdYearly : plan.polarProductIdMonthly;

    sub = await prisma.subscription.upsert({
      where: { brandId },
      update: {
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
        trialEndsAt: null,
        polarProductId: productId,
        provider: PaymentProvider.POLAR,
      },
      create: {
        brandId,
        planId,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
        trialEndsAt: null,
        polarProductId: productId,
        provider: PaymentProvider.POLAR,
      },
      include: { plan: true },
    });

    return { data: sub, customerId: customer.id, productId };
  }
}

async function startTrial({ brandId, planId, trialDays }) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan) throw new Error("Plan not found");

  const days = trialDays ?? plan.trialDays ?? 14;
  const trialEndsAt = dayjs().add(days, "day").toDate();

  const sub = await prisma.subscription.upsert({
    where: { brandId },
    update: {
      planId,
      status: SubscriptionStatus.TRIALING,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
    },
    create: {
      brandId,
      planId,
      status: SubscriptionStatus.TRIALING,
      trialEndsAt,
      currentPeriodEnd: trialEndsAt,
    },
    include: { plan: true },
  });

  return { data: sub };
}

async function getBrandSubscription({ brandId }) {
  const sub = await prisma.subscription.findUnique({
    where: { brandId },
    include: { plan: true, brand: { select: { name: true } } },
  });
  if (!sub) throw new Error("Subscription not found");
  return { data: sub };
}

/**
 * Create Stripe checkout session for subscription
 */
async function createCheckoutSession({
  brandId,
  planId,
  period,
  successUrl,
  cancelUrl,
  trialDays = null,
  provider = "STRIPE",
}) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan) throw new Error("Plan not found");

  const useStripe = provider === "STRIPE";
  const usePolar = provider === "POLAR";

  // Ensure plan is synced with chosen provider
  if (useStripe && (!plan.stripePriceIdMonthly || !plan.stripePriceIdYearly)) {
    await stripeService.syncPlanToStripe({
      planId: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      features: plan.features,
    });
    const updatedPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    Object.assign(plan, updatedPlan);
  } else if (usePolar && (!plan.polarProductIdMonthly || !plan.polarProductIdYearly)) {
    await polarService.syncProductToPolar({
      planId: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      features: plan.features,
      organizationId: process.env.POLAR_ORGANIZATION_ID,
    });
    const updatedPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
    Object.assign(plan, updatedPlan);
  }

  // Get brand details
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { owner: { select: { email: true } } },
  });
  if (!brand) throw new Error("Brand not found");

  if (useStripe) {
    // Create or get Stripe customer
    const customer = await stripeService.getOrCreateCustomer({
      brandId,
      email: brand.email || brand.owner.email,
      name: brand.name,
    });

    const priceId =
      period === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      customerId: customer.id,
      priceId,
      brandId,
      successUrl,
      cancelUrl,
      trialPeriodDays: trialDays,
    });

    return { data: session };
  } else {
    // Create or get Polar customer
    const customer = await polarService.getOrCreateCustomer({
      brandId,
      email: brand.email || brand.owner.email,
      name: brand.name,
    });

    const productPriceId =
      period === "yearly" ? plan.polarProductIdYearly : plan.polarProductIdMonthly;

    // Create checkout session
    const session = await polarService.createCheckoutSession({
      customerId: customer.id,
      productPriceId,
      brandId,
      successUrl,
    });

    return { data: session };
  }
}

/**
 * Create billing portal session
 */
async function createBillingPortal({ brandId, returnUrl, provider = "STRIPE" }) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { stripeCustomerId: true, polarCustomerId: true },
  });

  if (provider === "STRIPE") {
    if (!brand?.stripeCustomerId) {
      throw new Error("No Stripe customer found for this brand");
    }

    const session = await stripeService.createBillingPortalSession({
      customerId: brand.stripeCustomerId,
      returnUrl,
    });

    return { data: session };
  } else {
    if (!brand?.polarCustomerId) {
      throw new Error("No Polar customer found for this brand");
    }

    const portalUrl = await polarService.getCustomerPortalUrl({
      customerId: brand.polarCustomerId,
    });

    return { data: { url: portalUrl } };
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription({ brandId, immediate = false }) {
  const subscription = await prisma.subscription.findUnique({
    where: { brandId },
  });

  if (!subscription) throw new Error("Subscription not found");

  if (subscription.provider === PaymentProvider.STRIPE) {
    if (!subscription.stripeSubscriptionId) {
      throw new Error("No active Stripe subscription");
    }

    await stripeService.cancelSubscription(
      subscription.stripeSubscriptionId,
      !immediate
    );
  } else {
    if (!subscription.polarSubscriptionId) {
      throw new Error("No active Polar subscription");
    }

    await polarService.cancelSubscription(
      subscription.polarSubscriptionId,
      !immediate
    );
  }

  // Update local subscription
  const updated = await prisma.subscription.update({
    where: { brandId },
    data: {
      cancelAtPeriodEnd: !immediate,
      canceledAt: immediate ? new Date() : null,
      status: immediate ? SubscriptionStatus.CANCELED : subscription.status,
    },
    include: { plan: true },
  });

  return { data: updated };
}

/**
 * Reactivate a canceled subscription
 */
async function reactivateSubscription({ brandId }) {
  const subscription = await prisma.subscription.findUnique({
    where: { brandId },
  });

  if (!subscription) throw new Error("Subscription not found");

  if (subscription.provider === PaymentProvider.STRIPE) {
    if (!subscription.stripeSubscriptionId) {
      throw new Error("No Stripe subscription to reactivate");
    }

    await stripeService.reactivateSubscription(
      subscription.stripeSubscriptionId
    );
  } else {
    if (!subscription.polarSubscriptionId) {
      throw new Error("No Polar subscription to reactivate");
    }

    await polarService.reactivateSubscription(
      subscription.polarSubscriptionId
    );
  }

  const updated = await prisma.subscription.update({
    where: { brandId },
    data: {
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
    include: { plan: true },
  });

  return { data: updated };
}

/**
 * Change subscription plan
 */
async function changeSubscriptionPlan({ brandId, newPlanId, period }) {
  const subscription = await prisma.subscription.findUnique({
    where: { brandId },
  });

  if (!subscription) throw new Error("Subscription not found");

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: newPlanId },
  });
  if (!newPlan) throw new Error("New plan not found");

  if (subscription.provider === PaymentProvider.STRIPE) {
    if (!subscription.stripeSubscriptionId) {
      throw new Error("No active Stripe subscription");
    }

    // Ensure new plan is synced
    if (!newPlan.stripePriceIdMonthly || !newPlan.stripePriceIdYearly) {
      await stripeService.syncPlanToStripe({
        planId: newPlan.id,
        name: newPlan.name,
        description: newPlan.description,
        priceMonthly: newPlan.priceMonthly,
        priceYearly: newPlan.priceYearly,
        currency: newPlan.currency,
        features: newPlan.features,
      });
      const updated = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId },
      });
      Object.assign(newPlan, updated);
    }

    const newPriceId =
      period === "yearly"
        ? newPlan.stripePriceIdYearly
        : newPlan.stripePriceIdMonthly;

    // Update in Stripe
    await stripeService.updateSubscription({
      subscriptionId: subscription.stripeSubscriptionId,
      newPriceId,
    });

    // Update local subscription
    const updated = await prisma.subscription.update({
      where: { brandId },
      data: {
        planId: newPlanId,
        stripePriceId: newPriceId,
      },
      include: { plan: true },
    });

    return { data: updated };
  } else {
    if (!subscription.polarSubscriptionId) {
      throw new Error("No active Polar subscription");
    }

    // Ensure new plan is synced
    if (!newPlan.polarProductIdMonthly || !newPlan.polarProductIdYearly) {
      await polarService.syncProductToPolar({
        planId: newPlan.id,
        name: newPlan.name,
        description: newPlan.description,
        priceMonthly: newPlan.priceMonthly,
        priceYearly: newPlan.priceYearly,
        currency: newPlan.currency,
        features: newPlan.features,
        organizationId: process.env.POLAR_ORGANIZATION_ID,
      });
      const updated = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId },
      });
      Object.assign(newPlan, updated);
    }

    const newProductId =
      period === "yearly"
        ? newPlan.polarProductIdYearly
        : newPlan.polarProductIdMonthly;

    // Update in Polar
    await polarService.updateSubscription({
      subscriptionId: subscription.polarSubscriptionId,
      newProductPriceId: newProductId,
    });

    // Update local subscription
    const updated = await prisma.subscription.update({
      where: { brandId },
      data: {
        planId: newPlanId,
        polarProductId: newProductId,
      },
      include: { plan: true },
    });

    return { data: updated };
  }
}

module.exports = {
  listPlans,
  subscribeBrand,
  startTrial,
  getBrandSubscription,
  createCheckoutSession,
  createBillingPortal,
  cancelSubscription,
  reactivateSubscription,
  changeSubscriptionPlan,
};
