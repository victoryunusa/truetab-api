const Joi = require("joi");

const createItemSchema = Joi.object({
  defaultName: Joi.string().min(2).required(),
  description: Joi.string().allow("", null),
  sku: Joi.string().allow("", null),
  isActive: Joi.boolean().default(true),
});

const updateItemSchema = Joi.object({
  defaultName: Joi.string().min(2),
  description: Joi.string().allow("", null),
  sku: Joi.string().allow("", null),
  isActive: Joi.boolean(),
});

const attachCategoriesSchema = Joi.object({
  categoryIds: Joi.array().items(Joi.string()).min(1).required(),
});

const i18nSchema = Joi.object({
  locale: Joi.string().min(2).max(10).required(),
  name: Joi.string().min(1).required(),
  description: Joi.string().allow("", null),
});

module.exports = {
  createItemSchema,
  updateItemSchema,
  attachCategoriesSchema,
  i18nSchema,
};
