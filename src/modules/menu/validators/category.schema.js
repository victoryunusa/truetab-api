const Joi = require("joi");

const createCategorySchema = Joi.object({
  name: Joi.string().min(2).required(),
  parentId: Joi.string().allow(null, ""),
  sortOrder: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2),
  parentId: Joi.string().allow(null, ""),
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
});

module.exports = { createCategorySchema, updateCategorySchema };
