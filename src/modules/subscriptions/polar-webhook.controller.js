'use strict';

const { PrismaClient, SubscriptionStatus } = require('@prisma/client');
const { verifyWebhookSignature } = require('../services/polar.service');
const { createInvoice } = require('../services/invoice.service');
const prisma = new PrismaClient();
const dayjs = require('dayjs');

async function handlePolarWebhook(req, res) {
  try {
    const signature =
      req.headers['x-polar-signature'] ||
      req.headers['webhook-signature'] ||
      req.headers['polar-signature'];

    const timestamp = req.headers['x-polar-timestamp'] || req.headers['webhook-timestamp'];

    if (!signature) {
      console.error('❌ Missing Polar signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Ensure we use the raw body exactly as received
    const rawBody = req.body.toString('utf8');

    // Verify signature
    const valid = verifyWebhookSignature(rawBody, signature, timestamp);
    if (!valid) {
      console.error('❌ Invalid Polar webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse JSON safely
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e.message);
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.log(`✅ Polar webhook received: ${event.type}`);

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

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Polar webhook handler failed:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/* ---------------- Event Handlers ---------------- */

async function handleSubscriptionCreated(event) {
  const sub = event.data;
  const brandId = sub.customer?.metadata?.brandId;

  if (!brandId) {
    console.error('Missing brandId in subscription metadata');
    return;
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [{ polarProductIdMonthly: sub.product_id }, { polarProductIdYearly: sub.product_id }],
    },
  });

  if (!plan) {
    console.error(`No plan found for product ID: ${sub.product_id}`);
    return;
  }

  const currentPeriodEnd = new Date(sub.current_period_end);
  const status = mapPolarStatus(sub.status);

  await prisma.subscription.upsert({
    where: { brandId },
    update: {
      planId: plan.id,
      status,
      currentPeriodEnd,
      polarSubscriptionId: sub.id,
      polarProductId: sub.product_id,
      provider: 'POLAR',
    },
    create: {
      brandId,
      planId: plan.id,
      status,
      currentPeriodEnd,
      polarSubscriptionId: sub.id,
      polarProductId: sub.product_id,
      provider: 'POLAR',
    },
  });

  console.log(`✅ Subscription created for brand ${brandId}: ${sub.id}`);
}

async function handleSubscriptionUpdated(event) {
  const sub = event.data;
  const status = mapPolarStatus(sub.status);
  await prisma.subscription.updateMany({
    where: { polarSubscriptionId: sub.id },
    data: {
      status,
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
  console.log(`💳 Checkout completed for brand ${brandId}: ${checkout.id}`);
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
