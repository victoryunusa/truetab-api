'use strict';

const { PrismaClient, SubscriptionStatus } = require('@prisma/client');
const { validateEvent, WebhookVerificationError } = require('@polar-sh/sdk/webhooks');
const { createInvoice } = require('./invoice.service');
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

    // Polar SDK expects raw buffer — convert to string
    const rawBody = req.body.toString('utf8');

    let event;
    try {
      event = validateEvent(rawBody, req.headers, webhookSecret);
      console.log('✅ Polar webhook received:', event.type);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error('❌ Webhook verification failed:', error.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }
      console.error('❌ Webhook validation error:', error.message);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Dispatch to correct handler
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
      case 'subscription.uncanceled':
        await handleSubscriptionUncanceled(event);
        break;
      case 'subscription.revoked':
        await handleSubscriptionRevoked(event);
        break;
      case 'invoice.created':
        await handleInvoiceCreated(event);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event);
        break;
      default:
        console.log(`ℹ️ Unhandled Polar event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Polar webhook error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/* ---------------- Event Handlers ---------------- */

async function handleSubscriptionCreated(event) {
  const subscription = event.data;
  const customer = subscription.customer;
  const product = subscription.product; // FIX: Get product from subscription

  if (!customer) {
    console.error('❌ No customer data in subscription');
    return;
  }

  // Look for brandId in customer metadata or use external_id
  const brandId = customer.metadata?.brandId || customer.external_id;

  if (!brandId) {
    console.error('❌ No brandId found in customer data');
    return;
  }

  // FIX: Check if product exists and get planID from product metadata
  const productId = product?.metadata?.planID;

  if (!productId) {
    console.error('❌ No planID found in product metadata');
    return;
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      id: productId,
    },
  });

  if (!plan) {
    console.error(`❌ No plan found for plan ID: ${productId}`);
    return;
  }

  // Parse and validate dates
  const currentPeriodEnd =
    parseDate(subscription.current_period_end) ||
    parseDate(subscription.ends_at) ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now

  const status = mapPolarStatus(subscription.status);
  const polarProductId = subscription.product_id || product?.id;

  if (!polarProductId) {
    console.error('❌ No product_id found in subscription');
    return;
  }

  const subscriptionData = {
    planId: plan.id,
    status,
    currentPeriodEnd,
    polarSubscriptionId: subscription.id,
    polarProductId,
    //polarCustomerId: customer.id,
    provider: 'POLAR',
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    //startedAt: parseDate(subscription.started_at),
    //canceledAt: parseDate(subscription.canceled_at),
    //endedAt: parseDate(subscription.ended_at),
  };

  await prisma.subscription.upsert({
    where: { brandId },
    update: subscriptionData,
    create: {
      status,
      currentPeriodEnd,
      polarSubscriptionId: subscription.id,
      polarProductId,
      //polarCustomerId: customer.id,
      provider: 'POLAR',
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      //startedAt: parseDate(subscription.started_at),
      //canceledAt: parseDate(subscription.canceled_at),
      //endedAt: parseDate(subscription.ended_at),
      brand: {
        connect: { id: brandId },
      },
      plan: {
        connect: { id: plan.id },
      },
    },
  });

  console.log(`✅ Polar subscription created for brand ${brandId}`);
}

async function handleSubscriptionActive(event) {
  const subscription = event.data;

  // Validate and parse dates with fallback
  const currentPeriodEnd = parseDate(subscription.current_period_end) || 
                           parseDate(subscription.ends_at) ||
                           new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Update subscription status
  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: subscription.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    },
  });

  console.log(`✅ Subscription active: ${subscription.id}`);

  // Create invoice for the active subscription
  await createInvoiceForSubscription(subscription);
}

async function handleSubscriptionUpdated(event) {
  const subscription = event.data;

  const updateData = {
    status: mapPolarStatus(subscription.status),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    modifiedAt: parseDate(subscription.modified_at),
    canceledAt: parseDate(subscription.canceled_at),
    endedAt: parseDate(subscription.ended_at),
  };

  // Only update currentPeriodEnd if we have a valid date
  const currentPeriodEnd = parseDate(subscription.current_period_end) || parseDate(subscription.ends_at);
  if (currentPeriodEnd) {
    updateData.currentPeriodEnd = currentPeriodEnd;
  }

  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: subscription.id },
    data: updateData,
  });

  console.log(`🔄 Subscription updated: ${subscription.id}`);
}

async function handleSubscriptionCanceled(event) {
  const subscription = event.data;

  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: subscription.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: parseDate(subscription.canceled_at) || new Date(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      endsAt: parseDate(subscription.ends_at),
    },
  });

  console.log(`🚫 Subscription canceled: ${subscription.id}`);
}

async function handleSubscriptionUncanceled(event) {
  const subscription = event.data;

  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: subscription.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      canceledAt: null,
      cancelAtPeriodEnd: false,
      endsAt: null,
    },
  });

  console.log(`🔄 Subscription uncanceled: ${subscription.id}`);
}

async function handleSubscriptionRevoked(event) {
  const subscription = event.data;

  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: subscription.id },
    data: {
      status: SubscriptionStatus.REVOKED,
      endedAt: parseDate(subscription.ended_at) || new Date(),
    },
  });

  console.log(`🚫 Subscription revoked: ${subscription.id}`);
}

async function handleInvoiceCreated(event) {
  const invoice = event.data;
  const subscriptionId = invoice.subscription_id;

  if (!subscriptionId) {
    console.log('ℹ️ Invoice created without subscription ID');
    return;
  }

  console.log(`🧾 Invoice created for subscription: ${subscriptionId}`);
  // You can store invoice reference if needed
}

async function handleInvoicePaymentSucceeded(event) {
  const invoice = event.data;
  const subscriptionId = invoice.subscription_id;

  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { polarSubscriptionId: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    console.error(`❌ No subscription found for Polar ID: ${subscriptionId}`);
    return;
  }

  try {
    // Determine period from invoice or subscription
    const period = invoice.recurring_interval === 'year' || subscription.plan.name.includes('Yearly') ? 'yearly' : 'monthly';
    
    await createInvoice({
      subscriptionId: subscription.id,
      brandId: subscription.brandId,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      period,
      periodStart: parseDate(invoice.period_start) || new Date(),
      periodEnd: parseDate(invoice.period_end) || new Date(subscription.currentPeriodEnd),
      provider: 'POLAR',
      polarInvoiceId: invoice.id,
      polarPaymentIntentId: invoice.payment_intent_id,
      planName: subscription.plan.name,
      status: 'paid',
    });
    console.log(`🧾 Invoice created and marked as paid for subscription ${subscriptionId}`);
  } catch (err) {
    console.error('❌ Failed to create invoice:', err.message);
  }
}

/* ---------------- Helper Functions ---------------- */

async function createInvoiceForSubscription(subscription) {
  try {
    const dbSubscription = await prisma.subscription.findUnique({
      where: { polarSubscriptionId: subscription.id },
      include: { plan: true },
    });

    if (!dbSubscription) {
      console.error(`❌ No local subscription found for Polar ID: ${subscription.id}`);
      return;
    }

    // Calculate amount (convert from cents to dollars)
    const amount = subscription.amount / 100;
    
    // Determine period (monthly or yearly) from recurring_interval
    const period = subscription.recurring_interval === 'year' ? 'yearly' : 'monthly';

    await createInvoice({
      subscriptionId: dbSubscription.id,
      brandId: dbSubscription.brandId,
      amount: amount,
      currency: subscription.currency.toUpperCase(),
      period,
      periodStart: parseDate(subscription.current_period_start) || new Date(),
      periodEnd:
        parseDate(subscription.current_period_end) || new Date(dbSubscription.currentPeriodEnd),
      provider: 'POLAR',
      polarSubscriptionId: subscription.id,
      polarProductId: subscription.product_id,
      planName: dbSubscription.plan.name,
      status: 'active',
    });

    console.log(`🧾 Invoice created for active subscription ${subscription.id}`);
  } catch (err) {
    console.error('❌ Failed to create invoice for active subscription:', err.message);
  }
}

function parseDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

function mapPolarStatus(polarStatus) {
  const map = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    unpaid: SubscriptionStatus.PAST_DUE,
    incomplete: SubscriptionStatus.PAST_DUE,
    // Add any additional statuses that might come from the new Polar API
  };
  return map[polarStatus] || SubscriptionStatus.EXPIRED;
}

module.exports = { handlePolarWebhook };
