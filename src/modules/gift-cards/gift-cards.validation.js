const Joi = require("joi");

const purchaseGiftCardSchema = Joi.object({
  amount: Joi.number().positive().min(5).max(5000).required(),
  recipientName: Joi.string().max(255).optional(),
  recipientEmail: Joi.string().email().optional(),
  recipientPhone: Joi.string().pattern(/^[\d\s\-\+\(\)]+$/).optional(),
  message: Joi.string().max(500).optional().allow(""),
  expiresInDays: Joi.number().integer().min(30).max(1825).optional(), // 30 days to 5 years
}).or("recipientEmail", "recipientPhone");

const redeemGiftCardSchema = Joi.object({
  code: Joi.string().required(),
  amount: Joi.number().positive().required(),
  orderId: Joi.string().uuid().required(),
});

const checkBalanceSchema = Joi.object({
  code: Joi.string().required(),
});

const issueStoreCreditSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  reason: Joi.string().max(500).required(),
  expiresInDays: Joi.number().integer().min(30).optional(),
});

const applyStoreCreditSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  orderId: Joi.string().uuid().required(),
});

module.exports = {
  purchaseGiftCardSchema,
  redeemGiftCardSchema,
  checkBalanceSchema,
  issueStoreCreditSchema,
  applyStoreCreditSchema,
};
