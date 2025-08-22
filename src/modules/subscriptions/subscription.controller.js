const {
  listPlans,
  subscribeBrand,
  startTrial,
  getBrandSubscription,
} = require("./subscription.service");
const Joi = require("joi");

const subscribeSchema = Joi.object({
  planId: Joi.string().required(),
  period: Joi.string().valid("monthly", "yearly").default("monthly"),
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
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

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
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

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

module.exports = {
  listPlansController,
  subscribeBrandController,
  startTrialController,
  getBrandSubscriptionController,
};
