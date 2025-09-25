const Joi = require("joi");

const createPromotionSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Promotion name is required",
    "string.min": "Promotion name must be at least 3 characters long",
    "string.max": "Promotion name must be less than 100 characters",
    "any.required": "Promotion name is required",
  }),
  description: Joi.string().max(500).optional().messages({
    "string.max": "Description must be less than 500 characters",
  }),
  type: Joi.string().valid("PERCENTAGE", "FIXED_AMOUNT", "BUY_ONE_GET_ONE", "FREE_ITEM").required().messages({
    "any.only": "Type must be one of: PERCENTAGE, FIXED_AMOUNT, BUY_ONE_GET_ONE, FREE_ITEM",
    "any.required": "Promotion type is required",
  }),
  value: Joi.number().positive().when("type", {
    is: Joi.valid("PERCENTAGE", "FIXED_AMOUNT"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }).messages({
    "number.positive": "Value must be positive",
    "any.required": "Value is required for percentage and fixed amount promotions",
  }),
  minOrderAmount: Joi.number().positive().optional().messages({
    "number.positive": "Minimum order amount must be positive",
  }),
  maxDiscount: Joi.number().positive().optional().messages({
    "number.positive": "Maximum discount must be positive",
  }),
  startDate: Joi.date().iso().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),
  endDate: Joi.date().iso().greater(Joi.ref("startDate")).required().messages({
    "date.base": "End date must be a valid date",
    "date.greater": "End date must be after start date",
    "any.required": "End date is required",
  }),
  usageLimit: Joi.number().integer().positive().optional().messages({
    "number.integer": "Usage limit must be an integer",
    "number.positive": "Usage limit must be positive",
  }),
  userLimit: Joi.number().integer().positive().optional().messages({
    "number.integer": "User limit must be an integer",
    "number.positive": "User limit must be positive",
  }),
  applicableItems: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Applicable items must be an array",
  }),
  applicableCategories: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Applicable categories must be an array",
  }),
  excludedItems: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Excluded items must be an array",
  }),
  code: Joi.string().alphanum().min(3).max(20).optional().messages({
    "string.alphanum": "Promotion code must be alphanumeric",
    "string.min": "Promotion code must be at least 3 characters long",
    "string.max": "Promotion code must be less than 20 characters",
  }),
  isActive: Joi.boolean().optional().default(true),
});

const updatePromotionSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    "string.min": "Promotion name must be at least 3 characters long",
    "string.max": "Promotion name must be less than 100 characters",
  }),
  description: Joi.string().max(500).optional().messages({
    "string.max": "Description must be less than 500 characters",
  }),
  value: Joi.number().positive().optional().messages({
    "number.positive": "Value must be positive",
  }),
  minOrderAmount: Joi.number().positive().optional().messages({
    "number.positive": "Minimum order amount must be positive",
  }),
  maxDiscount: Joi.number().positive().optional().messages({
    "number.positive": "Maximum discount must be positive",
  }),
  startDate: Joi.date().iso().optional().messages({
    "date.base": "Start date must be a valid date",
  }),
  endDate: Joi.date().iso().optional().messages({
    "date.base": "End date must be a valid date",
  }),
  usageLimit: Joi.number().integer().positive().optional().messages({
    "number.integer": "Usage limit must be an integer",
    "number.positive": "Usage limit must be positive",
  }),
  userLimit: Joi.number().integer().positive().optional().messages({
    "number.integer": "User limit must be an integer",
    "number.positive": "User limit must be positive",
  }),
  applicableItems: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Applicable items must be an array",
  }),
  applicableCategories: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Applicable categories must be an array",
  }),
  excludedItems: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Excluded items must be an array",
  }),
  isActive: Joi.boolean().optional(),
});

module.exports = { createPromotionSchema, updatePromotionSchema };