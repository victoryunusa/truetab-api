const { PrismaClient, SubscriptionStatus } = require('@prisma/client');
const { validateEvent, WebhookVerificationError } = require('@polar-sh/sdk/webhooks');
const { createInvoice } = require('./invoice.service');
const dayjs = require('dayjs');

const prisma = new PrismaClient();

/**
 * Handle Polar webhook events
 */
async function handlePolarWebhook(req, res) {
  try {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('POLAR_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Validate and parse webhook event using official Polar SDK
    let event;
    try {
      event = validateEvent(req.body, req.headers, webhookSecret);
      console.log('Polar webhook received:', event.type);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error('Webhook verification failed:', error.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }
      console.error('Webhook validation error:', error.message);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Handle different event types
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event);
        break;

      case 'subscription.active':
        await handleSubscriptionActive(event);
        break;

      case 'subscription.past_due':
        await handleSubscriptionPastDue(event);
        break;

      case 'checkout.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'subscription.payment_succeeded':
        await handlePaymentSucceeded(event);
        break;

      default:
        console.log(`Unhandled Polar event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Polar webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(event) {
  const subscription = event.data;
  const brandId = subscription.metadata?.brandId;

  if (!brandId) {
    console.error('No brandId in subscription metadata');
    return;
  }

  // Find the plan by Polar product ID
  const productId = subscription.product_id;
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [{ polarProductIdMonthly: productId }, { polarProductIdYearly: productId }],
    },
  });

  if (!plan) {
    console.error(`No plan found for Polar product ID: ${productId}`);
    return;
  }

  const currentPeriodEnd = new Date(subscription.current_period_end);
  const status = mapPolarStatus(subscription.status);

  await prisma.subscription.upsert({
    where: { brandId },
    update: {
      planId: plan.id,
      status,
      currentPeriodEnd,
      polarSubscriptionId: subscription.id,
      polarProductId: productId,
      provider: 'POLAR',
    },
    create: {
      brandId,
      planId: plan.id,
      status,
      currentPeriodEnd,
      polarSubscriptionId: subscription.id,
      polarProductId: productId,
      provider: 'POLAR',
    },
  });

  console.log(`Polar subscription created for brand ${brandId}: ${subscription.id}`);
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(event) {
  const subscription = event.data;
  const polarSubId = subscription.id;

  const existingSub = await prisma.subscription.findUnique({
    where: { polarSubscriptionId: polarSubId },
  });

  if (!existingSub) {
    console.error(`No subscription found for Polar ID: ${polarSubId}`);
    return;
  }

  const currentPeriodEnd = new Date(subscription.current_period_end);
  const status = mapPolarStatus(subscription.status);

  await prisma.subscription.update({
    where: { polarSubscriptionId: polarSubId },
    data: {
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    },
  });

  console.log(`Polar subscription updated: ${polarSubId}`);
}

/**
 * Handle subscription.canceled event
 */
async function handleSubscriptionCanceled(event) {
  const subscription = event.data;
  const polarSubId = subscription.id;

  const existingSub = await prisma.subscription.findUnique({
    where: { polarSubscriptionId: polarSubId },
  });

  if (!existingSub) {
    console.error(`No subscription found for Polar ID: ${polarSubId}`);
    return;
  }

  await prisma.subscription.update({
    where: { polarSubscriptionId: polarSubId },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Polar subscription canceled: ${polarSubId}`);
}

/**
 * Handle subscription.active event
 */
async function handleSubscriptionActive(event) {
  const subscription = event.data;
  const polarSubId = subscription.id;

  const existingSub = await prisma.subscription.findUnique({
    where: { polarSubscriptionId: polarSubId },
  });

  if (!existingSub) {
    console.error(`No subscription found for Polar ID: ${polarSubId}`);
    return;
  }

  const currentPeriodEnd = new Date(subscription.current_period_end);

  await prisma.subscription.update({
    where: { polarSubscriptionId: polarSubId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd,
    },
  });

  console.log(`Polar subscription activated: ${polarSubId}`);
}

/**
 * Handle subscription.past_due event
 */
async function handleSubscriptionPastDue(event) {
  const subscription = event.data;
  const polarSubId = subscription.id;

  const existingSub = await prisma.subscription.findUnique({
    where: { polarSubscriptionId: polarSubId },
  });

  if (!existingSub) {
    console.error(`No subscription found for Polar ID: ${polarSubId}`);
    return;
  }

  await prisma.subscription.update({
    where: { polarSubscriptionId: polarSubId },
    data: {
      status: SubscriptionStatus.PAST_DUE,
    },
  });

  console.log(`Polar subscription past due: ${polarSubId}`);
}

/**
 * Handle checkout.completed event
 */
async function handleCheckoutCompleted(event) {
  const checkout = event.data;
  const brandId = checkout.metadata?.brandId;

  if (!brandId) {
    console.error('No brandId in checkout metadata');
    return;
  }

  // The subscription should be created via subscription.created event
  // This is just for logging
  console.log(`Polar checkout completed for brand ${brandId}: ${checkout.id}`);
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(event) {
  const payment = event.data;
  const subscriptionId = payment.subscription_id;

  if (!subscriptionId) {
    return; // Not a subscription payment
  }

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { polarSubscriptionId: subscriptionId },
    include: { plan: true, brand: true },
  });

  if (!subscription) {
    console.error(`Subscription not found for Polar ID: ${subscriptionId}`);
    return;
  }

  // Create invoice record
  try {
    const amount = payment.amount / 100; // Convert from cents
    const periodStart = new Date(payment.period_start);
    const periodEnd = new Date(payment.period_end);

    // Determine period type
    const period = payment.recurring_interval === 'year' ? 'yearly' : 'monthly';

    await createInvoice({
      subscriptionId: subscription.id,
      brandId: subscription.brandId,
      amount,
      currency: payment.currency.toUpperCase(),
      period,
      periodStart,
      periodEnd,
      provider: 'POLAR',
      polarInvoiceId: payment.invoice_id,
      polarPaymentId: payment.id,
      planName: subscription.plan.name,
      taxAmount: payment.tax_amount ? payment.tax_amount / 100 : 0,
      discountAmount: 0,
    });

    console.log(`Invoice created for Polar subscription ${subscriptionId}`);
  } catch (error) {
    console.error(`Failed to create Polar invoice record:`, error.message);
  }
}

/**
 * Map Polar subscription status to our SubscriptionStatus enum
 */
function mapPolarStatus(polarStatus) {
  const statusMap = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    unpaid: SubscriptionStatus.PAST_DUE,
    incomplete: SubscriptionStatus.PAST_DUE,
  };

  return statusMap[polarStatus] || SubscriptionStatus.EXPIRED;
}

module.exports = {
  handlePolarWebhook,
};
