'use strict';

const { PrismaClient, SubscriptionStatus } = require('@prisma/client');
const { validateEvent, WebhookVerificationError } = require('@polar-sh/sdk/webhooks');
const { createInvoice } = require('../services/invoice.service');
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
  const brandId = subscription.customer?.metadata?.brandId;

  if (!brandId) {
    console.error('❌ No brandId in subscription metadata');
    return;
  }

  const productId = subscription.product_id;

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [{ polarProductIdMonthly: productId }, { polarProductIdYearly: productId }],
    },
  });

  if (!plan) {
    console.error(`❌ No plan found for Polar product ID: ${productId}`);
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

  console.log(`✅ Polar subscription created for brand ${brandId}`);
}

async function handleSubscriptionUpdated(event) {
  const sub = event.data;
  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: sub.id },
    data: {
      status: mapPolarStatus(sub.status),
      currentPeriodEnd: new Date(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
    },
  });
  console.log(`🔄 Subscription updated: ${sub.id}`);
}

async function handleSubscriptionCanceled(event) {
  const sub = event.data;
  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: sub.id },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  });
  console.log(`🚫 Subscription canceled: ${sub.id}`);
}

async function handleSubscriptionActive(event) {
  const sub = event.data;
  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: sub.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(sub.current_period_end),
    },
  });
  console.log(`✅ Subscription active: ${sub.id}`);
}

async function handleSubscriptionPastDue(event) {
  const sub = event.data;
  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: sub.id },
    data: { status: SubscriptionStatus.PAST_DUE },
  });
  console.log(`⚠️ Subscription past due: ${sub.id}`);
}

async function handleCheckoutCompleted(event) {
  const checkout = event.data;
  const brandId = checkout.metadata?.brandId;
  console.log(`💳 Checkout completed for brand ${brandId || 'unknown'}`);
}

async function handlePaymentSucceeded(event) {
  const payment = event.data;
  const subId = payment.subscription_id;

  if (!subId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { polarSubscriptionId: subId },
    include: { plan: true },
  });
  if (!subscription) return;

  try {
    await createInvoice({
      subscriptionId: subscription.id,
      brandId: subscription.brandId,
      amount: payment.amount / 100,
      currency: payment.currency.toUpperCase(),
      periodStart: new Date(payment.period_start),
      periodEnd: new Date(payment.period_end),
      provider: 'POLAR',
      polarInvoiceId: payment.invoice_id,
      polarPaymentId: payment.id,
      planName: subscription.plan.name,
    });
    console.log(`🧾 Invoice created for subscription ${subId}`);
  } catch (err) {
    console.error('❌ Failed to create invoice:', err.message);
  }
}

function mapPolarStatus(polarStatus) {
  const map = {
    active: SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    unpaid: SubscriptionStatus.PAST_DUE,
    incomplete: SubscriptionStatus.PAST_DUE,
  };
  return map[polarStatus] || SubscriptionStatus.EXPIRED;
}

module.exports = { handlePolarWebhook };
