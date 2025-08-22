const Joi = require("joi");

const createVariantSchema = Joi.object({
  name: Joi.string().min(1).required(),
  price: Joi.number().precision(2).min(0).required(),
  costPrice: Joi.number().precision(2).min(0).allow(null),
  sku: Joi.string().allow("", null),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateVariantSchema = Joi.object({
  name: Joi.string().min(1),
  price: Joi.number().precision(2).min(0),
  costPrice: Joi.number().precision(2).min(0).allow(null),
  sku: Joi.string().allow("", null),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
});

const branchOverrideSchema = Joi.object({
  price: Joi.number().precision(2).min(0).allow(null),
  isAvailable: Joi.boolean().default(true),
});

module.exports = {
  createVariantSchema,
  updateVariantSchema,
  branchOverrideSchema,
};
