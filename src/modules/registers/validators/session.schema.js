const Joi = require("joi");

const openSessionSchema = Joi.object({
  openingFloat: Joi.number().precision(2).min(0).required(),
});

const closeSessionSchema = Joi.object({
  countedClose: Joi.number().precision(2).min(0).required(),
  notes: Joi.string().allow("", null),
});

const movementSchema = Joi.object({
  type: Joi.string()
    .valid("SALE", "REFUND", "PAID_IN", "PAID_OUT", "ADJUSTMENT")
    .required(),
  amount: Joi.number().precision(2).positive().required(),
  reason: Joi.string().allow("", null),
  orderId: Joi.string().allow("", null),
});

module.exports = {
  openSessionSchema,
  closeSessionSchema,
  movementSchema,
  closeSessionSchema,
};
