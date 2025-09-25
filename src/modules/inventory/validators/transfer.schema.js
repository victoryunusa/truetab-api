const Joi = require("joi");

const transferSchema = Joi.object({
  fromBranchId: Joi.string().required().messages({
    "string.empty": "Source branch ID is required",
    "any.required": "Source branch ID is required",
  }),
  toBranchId: Joi.string().required().messages({
    "string.empty": "Destination branch ID is required",
    "any.required": "Destination branch ID is required",
  }),
  productId: Joi.string().required().messages({
    "string.empty": "Product ID is required",
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().positive().integer().required().messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be positive",
    "number.integer": "Quantity must be an integer",
    "any.required": "Quantity is required",
  }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": "Notes must be less than 500 characters",
  }),
});

const completeTransferSchema = Joi.object({
  receivedQuantity: Joi.number().positive().integer().optional().messages({
    "number.base": "Received quantity must be a number",
    "number.positive": "Received quantity must be positive",
    "number.integer": "Received quantity must be an integer",
  }),
  notes: Joi.string().max(500).optional().messages({
    "string.max": "Notes must be less than 500 characters",
  }),
});

module.exports = { transferSchema, completeTransferSchema };