const Joi = require("joi");

const createIntegrationSchema = Joi.object({
  providerId: Joi.string().uuid().required(),
  branchId: Joi.string().uuid().optional(),
  credentials: Joi.object().required(), // Provider-specific credentials
  settings: Joi.object().optional(),
});

const updateIntegrationSchema = Joi.object({
  isEnabled: Joi.boolean().optional(),
  credentials: Joi.object().optional(),
  settings: Joi.object().optional(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "PICKED_UP",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELLED",
      "FAILED"
    )
    .required(),
});

module.exports = {
  createIntegrationSchema,
  updateIntegrationSchema,
  updateOrderStatusSchema,
};
