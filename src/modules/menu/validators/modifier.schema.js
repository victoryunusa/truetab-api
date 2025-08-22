const Joi = require("joi");

const createGroupSchema = Joi.object({
  name: Joi.string().min(1).required(),
  minSelect: Joi.number().integer().min(0).default(0),
  maxSelect: Joi.number().integer().min(0).default(1),
  required: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().min(1),
  minSelect: Joi.number().integer().min(0),
  maxSelect: Joi.number().integer().min(0),
  required: Joi.boolean(),
  isActive: Joi.boolean(),
});

const createOptionSchema = Joi.object({
  name: Joi.string().min(1).required(),
  price: Joi.number().precision(2).min(0).required(),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().min(0).default(0),
});

const updateOptionSchema = Joi.object({
  name: Joi.string().min(1),
  price: Joi.number().precision(2).min(0),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer().min(0),
});

const linkGroupsSchema = Joi.object({
  groupIds: Joi.array().items(Joi.string()).min(1).required(),
  required: Joi.boolean().default(false), // used only for Item links
});

module.exports = {
  createGroupSchema,
  updateGroupSchema,
  createOptionSchema,
  updateOptionSchema,
  linkGroupsSchema,
};
