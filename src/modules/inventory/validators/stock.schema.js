const Joi = require("joi");

const createStockTxSchema = Joi.object({
  productId: Joi.string().required(),
  type: Joi.string()
    .valid("PURCHASE", "ADJUSTMENT", "WASTAGE", "TRANSFER", "SALE", "RETURN")
    .required(),
  quantity: Joi.number().precision(3).required(),
  unitCost: Joi.number().precision(2).min(0).allow(null),
  reference: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
});

const listStockTxQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(20),
  productId: Joi.string().allow("", null),
  type: Joi.string().valid(
    "PURCHASE",
    "ADJUSTMENT",
    "WASTAGE",
    "TRANSFER",
    "SALE",
    "RETURN"
  ),
});

module.exports = {
  createStockTxSchema,
  listStockTxQuerySchema,
};
