const Joi = require('joi');

const businessHoursSchema = Joi.object({
  monday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
  tuesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
  wednesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
  thursday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
  friday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
  saturday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
  sunday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
});

const updateSettingsSchema = Joi.object({
  businessName: Joi.string().max(200).optional(),
  businessAddress: Joi.string().max(500).optional(),
  businessPhone: Joi.string().max(50).optional(),
  businessEmail: Joi.string().email().optional(),
  website: Joi.string().uri().optional(),
  logo: Joi.string().uri().optional(),
  businessHours: businessHoursSchema.optional(),
  timezone: Joi.string().optional(),
  paymentSettings: Joi.object().optional(),
  receiptSettings: Joi.object().optional(),
  orderSettings: Joi.object().optional(),
  notifications: Joi.object().optional(),
  taxSettings: Joi.object().optional(),
  features: Joi.object().optional(),
  emailSettings: Joi.object().optional(),
  currency: Joi.string().max(10).optional(),
  language: Joi.string().max(10).optional(),
  dateFormat: Joi.string().max(50).optional(),
  timeFormat: Joi.string().valid('12h', '24h').optional(),
}).min(1);

module.exports = {
  updateSettingsSchema,
};
