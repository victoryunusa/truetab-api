const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  sku: Joi.string().allow('', null),
  barcode: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  unit: Joi.string()
    .valid(
      'pcs',
      'kg',
      'g',
      'liters',
      'ml',
      'pack',
      'piece',
      'box',
      'bottle',
      'can',
      'bag',
      'carton',
      'jar',
      'tube',
      'roll',
      'set',
      'pair',
      'dozen',
      'meter',
      'cm',
      'mm',
      'liter',
      'gallon',
      'pint',
      'unit',
      'oz',
      'lb'
    )
    .required(),
  costPrice: Joi.number().precision(2).min(0).required(),
  sellPrice: Joi.number().precision(2).min(0).required(),
  categoryId: Joi.string().allow('', null),
  trackStock: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true),
});

const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  sku: Joi.string().allow('', null),
  barcode: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  unit: Joi.string()
    .valid(
      'pcs',
      'kg',
      'g',
      'liters',
      'ml',
      'pack',
      'piece',
      'box',
      'bottle',
      'can',
      'bag',
      'carton',
      'jar',
      'tube',
      'roll',
      'set',
      'pair',
      'dozen',
      'meter',
      'cm',
      'mm',
      'liter',
      'gallon',
      'pint',
      'unit',
      'oz',
      'lb'
    )
    .required(),
  costPrice: Joi.number().precision(2).min(0),
  sellPrice: Joi.number().precision(2).min(0),
  categoryId: Joi.string().allow('', null),
  trackStock: Joi.boolean(),
  isActive: Joi.boolean(),
}).min(1);

const listProductQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(20),
  search: Joi.string().allow('', null),
  categoryId: Joi.string().allow('', null),
  isActive: Joi.boolean(),
  orderBy: Joi.string().valid('name', 'createdAt', 'updatedAt').default('name'),
  order: Joi.string().valid('asc', 'desc').default('asc'),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductQuerySchema,
};
