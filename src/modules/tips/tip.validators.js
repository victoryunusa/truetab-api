const Joi = require("joi");

const createTipSchema = Joi.object({
  orderId: Joi.string().optional(),
  registerId: Joi.string().optional(),
  staffId: Joi.string().optional(),
  amount: Joi.number().positive().required(),
  method: Joi.string().valid("CASH", "CARD", "OTHER").required(),
  type: Joi.string().valid("DIRECT", "POOLED", "BRANCH").required(),
  note: Joi.string().allow(""),
});

module.exports = { createTipSchema };
