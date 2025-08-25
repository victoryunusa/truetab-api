const Joi = require("joi");

const createRecipeSchema = Joi.object({
  name: Joi.string().min(2).required(),
  itemId: Joi.string().allow(null).optional(),
  variantId: Joi.string().allow(null).optional(),
  isActive: Joi.boolean().default(true),
}).xor('itemId', 'variantId'); // Recipe must be linked to either an item OR a variant, not both

const updateRecipeSchema = Joi.object({
  name: Joi.string().min(2),
  itemId: Joi.string().allow(null),
  variantId: Joi.string().allow(null),
  isActive: Joi.boolean(),
}).with('itemId', ['variantId']); // If itemId is provided, variantId must also be provided (can be null)

const createRecipeItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().positive().precision(3).required(),
  wastePct: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
});

const updateRecipeItemSchema = Joi.object({
  productId: Joi.string(),
  quantity: Joi.number().positive().precision(3),
  wastePct: Joi.number().min(0).max(100).precision(2).allow(null),
});

const batchUpdateRecipeItemsSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    id: Joi.string().optional(), // If provided, update existing; if not, create new
    productId: Joi.string().required(),
    quantity: Joi.number().positive().precision(3).required(),
    wastePct: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
  })).min(1).required(),
});

const duplicateRecipeSchema = Joi.object({
  name: Joi.string().min(2).required(),
  itemId: Joi.string().allow(null).optional(),
  variantId: Joi.string().allow(null).optional(),
}).xor('itemId', 'variantId');

module.exports = {
  createRecipeSchema,
  updateRecipeSchema,
  createRecipeItemSchema,
  updateRecipeItemSchema,
  batchUpdateRecipeItemsSchema,
  duplicateRecipeSchema,
};
