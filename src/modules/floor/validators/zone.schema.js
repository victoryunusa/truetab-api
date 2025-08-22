const Joi = require("joi");

const createZoneSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  isActive: Joi.boolean().optional(),
  branchId: Joi.string().optional(), // allow explicit branchId, else from tenant
});

const updateZoneSchema = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = { createZoneSchema, updateZoneSchema };
