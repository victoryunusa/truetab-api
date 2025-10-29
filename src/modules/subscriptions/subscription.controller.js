const {
  listPlans,
  subscribeBrand,
  startTrial,
  getBrandSubscription,
  createCheckoutSession,
  createBillingPortal,
  cancelSubscription,
  reactivateSubscription,
  changeSubscriptionPlan,
} = require('./subscription.service');
const Joi = require('joi');

const subscribeSchema = Joi.object({
  planId: Joi.string().required(),
  period: Joi.string().valid('monthly', 'yearly').default('monthly'),
  provider: Joi.string().valid('POLAR', 'STRIPE').default('STRIPE'),
});

const trialSchema = Joi.object({
  planId: Joi.string().required(),
  trialDays: Joi.number().integer().min(1).max(60),
});

async function listPlansController(req, res) {
  try {
    const country = req.query.country || null;
    const plans = await listPlans({ country });
    res.json({ data: plans });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function subscribeBrandController(req, res) {
  try {
    const brandId = req.params.brandId;
    const { value, error } = subscribeSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const out = await subscribeBrand({ brandId, ...value });
    res.status(200).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function startTrialController(req, res) {
  try {
    const brandId = req.params.brandId;
    const { value, error } = trialSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const out = await startTrial({ brandId, ...value });
    res.status(200).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function getBrandSubscriptionController(req, res) {
  try {
    const brandId = req.params.brandId;
    const data = await getBrandSubscription({ brandId });
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

const checkoutSchema = Joi.object({
  planId: Joi.string().required(),
  period: Joi.string().valid('monthly', 'yearly').default('monthly'),
  successUrl: Joi.string().uri().required(),
  cancelUrl: Joi.string().uri().required(),
  trialDays: Joi.number().integer().min(0).max(60).optional(),
  provider: Joi.string().valid('POLAR', 'STRIPE').optional(),
});

async function createCheckoutSessionController(req, res) {
  try {
    const brandId = req.params.brandId;
    const { value, error } = checkoutSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await createCheckoutSession({ brandId, ...value });

    res.status(200).json(result);
  } catch (e) {
    console.log(e);
    res.status(400).json({ error: e.message });
  }
}

const billingPortalSchema = Joi.object({
  returnUrl: Joi.string().uri().required(),
  provider: Joi.string().valid('POLAR', 'STRIPE').optional(),
});

async function createBillingPortalController(req, res) {
  try {
    const brandId = req.params.brandId;
    const { value, error } = billingPortalSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await createBillingPortal({ brandId, ...value });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

const cancelSchema = Joi.object({
  immediate: Joi.boolean().default(false),
});

async function cancelSubscriptionController(req, res) {
  try {
    const brandId = req.params.brandId;
    const { value, error } = cancelSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await cancelSubscription({ brandId, ...value });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function reactivateSubscriptionController(req, res) {
  try {
    const brandId = req.params.brandId;
    const result = await reactivateSubscription({ brandId });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

const changePlanSchema = Joi.object({
  newPlanId: Joi.string().required(),
  period: Joi.string().valid('monthly', 'yearly').required(),
});

async function changeSubscriptionPlanController(req, res) {
  try {
    const brandId = req.params.brandId;
    const { value, error } = changePlanSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await changeSubscriptionPlan({ brandId, ...value });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = {
  listPlansController,
  subscribeBrandController,
  startTrialController,
  getBrandSubscriptionController,
  createCheckoutSessionController,
  createBillingPortalController,
  cancelSubscriptionController,
  reactivateSubscriptionController,
  changeSubscriptionPlanController,
};
