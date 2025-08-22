const Joi = require("joi");

const createTableSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  capacity: Joi.number().integer().min(1).default(2),
  zoneId: Joi.string().allow(null, "").optional(),
  branchId: Joi.string().optional(), // allow override; else tenant
});

const updateTableSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  zoneId: Joi.string().allow(null, "").optional(),
  status: Joi.string()
    .valid("AVAILABLE", "OCCUPIED", "RESERVED", "OUT_OF_SERVICE")
    .optional(),
});

module.exports = { createTableSchema, updateTableSchema };
