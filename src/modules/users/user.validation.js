const Joi = require("joi");

const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid("BRAND_ADMIN", "STAFF").required(),
});

const updateRoleSchema = Joi.object({
  role: Joi.string().valid("BRAND_ADMIN", "STAFF").required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional(),
  avatarUrl: Joi.string().uri().optional(),
});

module.exports = { inviteUserSchema, updateRoleSchema, updateProfileSchema };
