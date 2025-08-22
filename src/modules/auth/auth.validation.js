const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
  firstName: Joi.string().min(1).max(64).required(),
  lastName: Joi.string().allow("", null),
  // Optional initial role, default to STAFF unless creating first brand owner via a protected flow later
  role: Joi.string()
    .valid("STAFF", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER")
    .default("STAFF"),
  brandId: Joi.string().allow(null),
  branchId: Joi.string().allow(null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};
