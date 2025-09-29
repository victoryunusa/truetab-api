const Joi = require('joi');

const demoRequestSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  lastName: Joi.string().allow('', null),
  company: Joi.string().allow('', null),
  message: Joi.string().max(500).allow('', null),
});

const approveSchema = Joi.object({
  id: Joi.string().required(),
});

const rejectSchema = Joi.object({
  id: Joi.string().required(),
});

module.exports = {
  demoRequestSchema,
  approveSchema,
  rejectSchema,
};
