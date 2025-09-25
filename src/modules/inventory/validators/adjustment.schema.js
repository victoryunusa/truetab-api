const Joi = require("joi");

const adjustmentSchema = Joi.object({
  productId: Joi.string().required().messages({
    "string.empty": "Product ID is required",
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().integer().required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "any.required": "Quantity is required",
  }),
  reason: Joi.string().min(3).max(500).required().messages({
    "string.empty": "Reason is required",
    "string.min": "Reason must be at least 3 characters long",
    "string.max": "Reason must be less than 500 characters",
    "any.required": "Reason is required",
  }),
});

module.exports = { adjustmentSchema };