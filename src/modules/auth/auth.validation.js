const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(8).max(72).required(),
  firstName: Joi.string().min(1).max(64).required(),
  lastName: Joi.string().allow('', null),
  code: Joi.string().required(),

  // User role
  role: Joi.string()
    .valid('STAFF', 'BRAND_OWNER', 'BRAND_ADMIN', 'BRANCH_MANAGER')
    .default('BRAND_OWNER'),

  // Either an existing brand/branch (joining)...
  brandId: Joi.string().allow(null),
  branchId: Joi.string().allow(null),

  // ...or creating a new brand in one go
  brandName: Joi.string().min(2).max(128),
  brandEmail: Joi.string().email().allow(null, ''),
  brandUrl: Joi.string().allow(null, ''),
  countryId: Joi.string(), // required if brandName is provided

  // Default branch (optional, otherwise auto = "Main Branch")
  branchName: Joi.string().min(2).max(128).allow(null, ''),
  branchLocation: Joi.string().max(255).allow(null, ''),
})
  // Add conditional: if brandName is provided, require countryId
  .when(Joi.object({ brandName: Joi.exist() }).unknown(), {
    then: Joi.object({
      countryId: Joi.string().required(),
    }),
  });

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(72).required(),
});

module.exports = { registerSchema, loginSchema };
