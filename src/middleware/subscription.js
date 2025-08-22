const { PrismaClient, SubscriptionStatus } = require("@prisma/client");
const dayjs = require("dayjs");
const prisma = new PrismaClient();

function requireActiveSubscription() {
  return async (req, res, next) => {
    try {
      const brandId = req.tenant?.brandId;
      if (!brandId)
        return res.status(400).json({ error: "brandId is required" });

      const sub = await prisma.subscription.findUnique({
        where: { brandId },
        include: { plan: true },
      });
      if (!sub)
        return res
          .status(402)
          .json({ error: "No subscription found for brand" });

      const now = dayjs();

      // Trial valid?
      const inTrial =
        sub.status === SubscriptionStatus.TRIALING &&
        sub.trialEndsAt &&
        now.isBefore(dayjs(sub.trialEndsAt));

      // Active period valid?
      const active =
        sub.status === SubscriptionStatus.ACTIVE &&
        now.isBefore(dayjs(sub.currentPeriodEnd));

      if (!inTrial && !active) {
        return res
          .status(402)
          .json({ error: "Subscription inactive or expired" });
      }

      req.subscription = sub; // expose plan & limits
      next();
    } catch (e) {
      next(e);
    }
  };
}

function enforcePlanLimit(limitKey, counterFn) {
  return async (req, res, next) => {
    try {
      const plan = req.subscription?.plan;
      if (!plan) return res.status(500).json({ error: "Plan not loaded" });

      const limit = plan[limitKey]; // may be null (unlimited)
      if (limit == null) return next();

      const count = await counterFn(req);
      if (count >= limit) {
        return res
          .status(403)
          .json({ error: `Plan limit reached: ${limitKey}=${limit}` });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireActiveSubscription, enforcePlanLimit };
