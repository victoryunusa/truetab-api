const Joi = require("joi");

const createReservationSchema = Joi.object({
  branchId: Joi.string().uuid().required(),
  tableId: Joi.string().uuid().optional(),
  customerId: Joi.string().uuid().optional(),
  customerName: Joi.string().when("customerId", {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  customerPhone: Joi.string().optional().allow(""),
  customerEmail: Joi.string().email().optional().allow(""),
  covers: Joi.number().integer().min(1).required(),
  reservedAt: Joi.date().required(),
  duration: Joi.number().integer().min(30).default(120), // minutes
  notes: Joi.string().optional().allow(""),
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "SEATED", "CANCELLED", "NO_SHOW")
    .default("PENDING"),
});

const updateReservationSchema = Joi.object({
  tableId: Joi.string().uuid().optional().allow(null),
  customerId: Joi.string().uuid().optional(),
  covers: Joi.number().integer().min(1).optional(),
  reservedAt: Joi.date().optional(),
  duration: Joi.number().integer().min(30).optional(),
  notes: Joi.string().optional().allow(""),
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "SEATED", "CANCELLED", "NO_SHOW")
    .optional(),
});

const searchReservationsSchema = Joi.object({
  branchId: Joi.string().uuid().optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string()
    .valid("PENDING", "CONFIRMED", "SEATED", "CANCELLED", "NO_SHOW")
    .optional(),
  tableId: Joi.string().uuid().optional(),
  customerId: Joi.string().uuid().optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

const checkAvailabilitySchema = Joi.object({
  branchId: Joi.string().uuid().required(),
  reservedAt: Joi.date().required(),
  covers: Joi.number().integer().min(1).required(),
  duration: Joi.number().integer().min(30).default(120),
  excludeReservationId: Joi.string().uuid().optional(),
});

module.exports = {
  createReservationSchema,
  updateReservationSchema,
  searchReservationsSchema,
  checkAvailabilitySchema,
};
