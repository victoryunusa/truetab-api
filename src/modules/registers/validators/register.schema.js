const Joi = require("joi");

const createRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  branchId: Joi.string().optional(), // default to tenant
  isActive: Joi.boolean().optional(),
});

const updateRegisterSchema = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  isActive: Joi.boolean().optional(),
});

module.exports = { createRegisterSchema, updateRegisterSchema };
