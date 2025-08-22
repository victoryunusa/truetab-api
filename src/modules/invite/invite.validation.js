const Joi = require("joi");

const acceptInviteSchema = Joi.object({
  token: Joi.string().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(6).required(),
});

module.exports = { acceptInviteSchema };
