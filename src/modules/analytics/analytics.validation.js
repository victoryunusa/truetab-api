const Joi = require('joi');

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  branchId: Joi.string().uuid().optional(),
});

const topItemsQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
  branchId: Joi.string().uuid().optional(),
});

module.exports = {
  dateRangeSchema,
  topItemsQuerySchema,
};
