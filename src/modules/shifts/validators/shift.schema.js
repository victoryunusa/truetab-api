const Joi = require("joi");

const createShiftTypeSchema = Joi.object({
  name: Joi.string().required(),
  branchId: Joi.string().allow("", null),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "startTime must be in HH:MM format",
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "endTime must be in HH:MM format",
    }),
  breakDuration: Joi.number().integer().min(0).default(0),
  color: Joi.string().allow("", null),
});

const updateShiftTypeSchema = Joi.object({
  name: Joi.string(),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  breakDuration: Joi.number().integer().min(0),
  color: Joi.string().allow("", null),
  isActive: Joi.boolean(),
});

const createShiftSchema = Joi.object({
  userId: Joi.string().required(),
  branchId: Joi.string().required(),
  shiftTypeId: Joi.string().allow("", null),
  scheduledStart: Joi.date().iso().required(),
  scheduledEnd: Joi.date().iso().required(),
  notes: Joi.string().allow("", null),
});

const updateShiftSchema = Joi.object({
  shiftTypeId: Joi.string().allow("", null),
  scheduledStart: Joi.date().iso(),
  scheduledEnd: Joi.date().iso(),
  actualStart: Joi.date().iso().allow(null),
  actualEnd: Joi.date().iso().allow(null),
  breakMinutes: Joi.number().integer().min(0),
  status: Joi.string().valid(
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW"
  ),
  notes: Joi.string().allow("", null),
});

const clockInSchema = Joi.object({
  shiftId: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
});

const clockOutSchema = Joi.object({
  notes: Joi.string().allow("", null),
});

const breakStartSchema = Joi.object({
  notes: Joi.string().allow("", null),
});

const breakEndSchema = Joi.object({
  notes: Joi.string().allow("", null),
});

module.exports = {
  createShiftTypeSchema,
  updateShiftTypeSchema,
  createShiftSchema,
  updateShiftSchema,
  clockInSchema,
  clockOutSchema,
  breakStartSchema,
  breakEndSchema,
};
