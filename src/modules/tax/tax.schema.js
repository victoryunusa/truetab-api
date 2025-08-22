const Joi = require("joi");

const createTaxSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  rate: Joi.number().min(0).max(100).required(), // percentage
  type: Joi.string().valid("INCLUSIVE", "EXCLUSIVE").required(),
  isActive: Joi.boolean().default(true),
});

const updateTaxSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  rate: Joi.number().min(0).max(100),
  type: Joi.string().valid("INCLUSIVE", "EXCLUSIVE"),
  isActive: Joi.boolean(),
});

module.exports = { createTaxSchema, updateTaxSchema };
