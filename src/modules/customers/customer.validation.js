const Joi = require("joi");

const createCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).optional().allow(""),
  phone: Joi.string().min(10).max(20).optional().allow(""),
  email: Joi.string().email().optional().allow(""),
  notes: Joi.string().max(1000).optional().allow(""),
});

const updateCustomerSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional(),
  lastName: Joi.string().min(1).max(100).optional().allow(""),
  phone: Joi.string().min(10).max(20).optional().allow(""),
  email: Joi.string().email().optional().allow(""),
  notes: Joi.string().max(1000).optional().allow(""),
});

const searchCustomerSchema = Joi.object({
  query: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().min(10).max(20).optional(),
  email: Joi.string().email().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

const createAddressSchema = Joi.object({
  label: Joi.string().max(50).optional().allow(""), // Home, Office, etc.
  line1: Joi.string().min(1).max(200).required(),
  line2: Joi.string().max(200).optional().allow(""),
  city: Joi.string().max(100).optional().allow(""),
  state: Joi.string().max(100).optional().allow(""),
  postalCode: Joi.string().max(20).optional().allow(""),
  country: Joi.string().max(100).optional().allow(""),
});

const updateAddressSchema = Joi.object({
  label: Joi.string().max(50).optional().allow(""),
  line1: Joi.string().min(1).max(200).optional(),
  line2: Joi.string().max(200).optional().allow(""),
  city: Joi.string().max(100).optional().allow(""),
  state: Joi.string().max(100).optional().allow(""),
  postalCode: Joi.string().max(20).optional().allow(""),
  country: Joi.string().max(100).optional().allow(""),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  searchCustomerSchema,
  createAddressSchema,
  updateAddressSchema,
};