const Joi = require("joi");

const updateTicketStatusSchema = Joi.object({
  delayReason: Joi.string().max(500).optional().allow(""),
});

const setPrioritySchema = Joi.object({
  priority: Joi.number().integer().min(0).max(10).required(),
});

module.exports = {
  updateTicketStatusSchema,
  setPrioritySchema,
};
