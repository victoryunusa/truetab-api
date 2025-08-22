const { PrismaClient, SubscriptionStatus } = require("@prisma/client");
const dayjs = require("dayjs");
const prisma = new PrismaClient();

async function listPlans({ country }) {
  // country filtering optional; add a country field later if needed
  return prisma.subscriptionPlan.findMany({ orderBy: { priceMonthly: "asc" } });
}

async function subscribeBrand({ brandId, planId, period }) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });
  if (!plan) throw new Error("Plan not found");

  const months = period === "yearly" ? 12 : 1;
  const currentPeriodEnd = dayjs().add(months, "month").toDate();

  const sub = await prisma.subscription.upsert({
    where: { brandId },
    update: {
      planId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd,
      trialEndsAt: null,
    },
    create: {
      brandId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd,
      trialEndsAt: null,
    },
    include: { plan: true },
  });

  return { data: sub };
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

module.exports = {
  listPlans,
  subscribeBrand,
  startTrial,
  getBrandSubscription,
};
