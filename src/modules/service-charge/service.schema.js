const Joi = require("joi");

const upsertServiceSchema = Joi.object({
  percentage: Joi.number().min(0).max(100).required(),
  type: Joi.string().valid("PERCENTAGE", "FIXED").required(),
  isActive: Joi.boolean().default(true),
});

module.exports = { upsertServiceSchema };
