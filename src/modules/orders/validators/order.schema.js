// src/modules/orders/validators/order.schema.js
const Joi = require("joi");

const orderCreateSchema = Joi.object({
  branchId: Joi.string().uuid().required(),
  tableId: Joi.string().uuid().allow(null),
  customerId: Joi.string().uuid().allow(null),
  type: Joi.string()
    .valid("DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE")
    .required(),
  billType: Joi.string().valid("FINE_DINE", "QUICK_BILL").optional(),
  covers: Joi.number().integer().min(1).allow(null),
  waiterId: Joi.string().uuid().allow(null),
  notes: Joi.string().allow("", null),

  items: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        variantId: Joi.string().uuid().required(), // enforce explicit variant
        quantity: Joi.number().integer().min(1).required(),
        modifierOptionIds: Joi.array().items(Joi.string().uuid()).default([]),
        notes: Joi.string().allow("", null),
      })
    )
    .min(1)
    .required(),

  payments: Joi.array()
    .items(
      Joi.object({
        method: Joi.string()
          .valid(
            "CASH",
            "CARD",
            "UPI",
            "STRIPE",
            "PAYSTACK",
            "FLUTTERWAVE",
            "OTHER"
          )
          .required(),
        amount: Joi.number().precision(2).min(0.01).required(),
        tipAmount: Joi.number().precision(2).min(0).default(0),
        reference: Joi.string().allow("", null),
        metadata: Joi.object().unknown(true),
      })
    )
    .default([]),
});

const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "OPEN",
      "IN_PROGRESS",
      "READY",
      "SERVED",
      "PART_PAID",
      "PAID",
      "CANCELLED",
      "REFUNDED"
    )
    .required(),
  message: Joi.string().allow("", null),
});

module.exports = { orderCreateSchema, orderStatusSchema };
