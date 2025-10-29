const { PrismaClient, SubscriptionStatus } = require("@prisma/client");
const stripeService = require("../../services/stripe.service");
const { createInvoice } = require("./invoice.service");
const dayjs = require("dayjs");

const prisma = new PrismaClient();

/**
 * Handle Stripe webhook events
 */
async function handleWebhook(req, res) {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({ error: "No signature provided" });
  }

  let event;

  try {
    // Construct event from raw body
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Received Stripe webhook event: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  const brandId = session.metadata.brandId;
  const subscriptionId = session.subscription;

  if (!brandId || !subscriptionId) {
    console.error("Missing brandId or subscriptionId in checkout session");
    return;
  }

  // Retrieve the subscription from Stripe
  const stripeSubscription = await stripeService.getSubscription(
    subscriptionId
  );

  // Get the price ID from the subscription
  const priceId = stripeSubscription.items.data[0]?.price.id;

  // Find the plan based on the price ID
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { stripePriceIdMonthly: priceId },
        { stripePriceIdYearly: priceId },
      ],
    },
  });

  if (!plan) {
    console.error(`Plan not found for price ID: ${priceId}`);
    return;
  }

  // Update or create subscription in database
  await prisma.subscription.upsert({
    where: { brandId },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
    create: {
      brandId,
      planId: plan.id,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
  });

  console.log(
    `Checkout session completed for brand ${brandId}, subscription ${subscriptionId}`
  );
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(stripeSubscription) {
  const brandId = stripeSubscription.metadata.brandId;

  if (!brandId) {
    console.error("Missing brandId in subscription metadata");
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price.id;

  // Find the plan
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { stripePriceIdMonthly: priceId },
        { stripePriceIdYearly: priceId },
      ],
    },
  });

  if (!plan) {
    console.error(`Plan not found for price ID: ${priceId}`);
    return;
  }

  await prisma.subscription.upsert({
    where: { brandId },
    update: {
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000
      ),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
    create: {
      brandId,
      planId: plan.id,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000
      ),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
  });

  console.log(`Subscription created for brand ${brandId}`);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(stripeSubscription) {
  const brandId = stripeSubscription.metadata.brandId;

  if (!brandId) {
    console.error("Missing brandId in subscription metadata");
    return;
  }

  const priceId = stripeSubscription.items.data[0]?.price.id;

  // Find the current subscription
  const subscription = await prisma.subscription.findUnique({
    where: { brandId },
  });

  if (!subscription) {
    console.error(`Subscription not found for brand ${brandId}`);
    return;
  }

  // Check if plan changed
  let planId = subscription.planId;
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { stripePriceIdMonthly: priceId },
        { stripePriceIdYearly: priceId },
      ],
    },
  });

  if (plan) {
    planId = plan.id;
  }

  await prisma.subscription.update({
    where: { brandId },
    data: {
      planId,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000
      ),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt:
        stripeSubscription.canceled_at && stripeSubscription.cancel_at_period_end
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
      trialEndsAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
  });

  console.log(`Subscription updated for brand ${brandId}`);
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(stripeSubscription) {
  const brandId = stripeSubscription.metadata.brandId;

  if (!brandId) {
    console.error("Missing brandId in subscription metadata");
    return;
  }

  await prisma.subscription.update({
    where: { brandId },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  console.log(`Subscription deleted for brand ${brandId}`);
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: { plan: true, brand: true },
  });

  if (!subscription) {
    console.error(`Subscription not found for Stripe ID: ${subscriptionId}`);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
    },
  });

  // Create invoice record
  try {
    const amount = invoice.amount_paid / 100; // Convert from cents
    const periodStart = new Date(invoice.period_start * 1000);
    const periodEnd = new Date(invoice.period_end * 1000);
    
    // Determine period type from interval
    const period = invoice.lines.data[0]?.price?.recurring?.interval === "year" 
      ? "yearly" 
      : "monthly";

    await createInvoice({
      subscriptionId: subscription.id,
      brandId: subscription.brandId,
      amount,
      currency: invoice.currency.toUpperCase(),
      period,
      periodStart,
      periodEnd,
      provider: "STRIPE",
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent,
      planName: subscription.plan.name,
      taxAmount: invoice.tax ? invoice.tax / 100 : 0,
      discountAmount: invoice.discount ? invoice.discount.coupon.amount_off / 100 : 0,
    });

    console.log(`Invoice created for subscription ${subscriptionId}`);
  } catch (error) {
    console.error(`Failed to create invoice record:`, error.message);
  }

  console.log(
    `Invoice payment succeeded for subscription ${subscriptionId}`
  );
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  // Update subscription status
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    console.log(`Invoice payment failed for subscription ${subscriptionId}`);
  }
}

/**
 * Map Stripe subscription status to our SubscriptionStatus enum
 */
function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
    case "unpaid":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
    case "incomplete_expired":
      return SubscriptionStatus.EXPIRED;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}

module.exports = {
  handleWebhook,
};
