// src/modules/inventory/validators/supplier.schema.js
const Joi = require("joi");

const createSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  contactName: Joi.string().allow("", null),
  phone: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
  address: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
  isActive: Joi.boolean().default(true),
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  contactName: Joi.string().allow("", null),
  phone: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
  address: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
  isActive: Joi.boolean(),
}).min(1);

const listSupplierQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(20),
  search: Joi.string().allow("", null),
  isActive: Joi.boolean(),
  orderBy: Joi.string().valid("name", "createdAt", "updatedAt").default("name"),
  order: Joi.string().valid("asc", "desc").default("asc"),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
  listSupplierQuerySchema,
};
