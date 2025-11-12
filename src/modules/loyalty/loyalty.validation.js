const Joi = require("joi");

// Loyalty Program
const createProgramSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().optional().allow(""),
  pointsPerCurrency: Joi.number().required().min(0),
  currencyPerPoint: Joi.number().required().min(0),
  minRedemptionPoints: Joi.number().integer().min(1).default(100),
  expiryDays: Joi.number().integer().min(1).optional(),
  isActive: Joi.boolean().default(true),
});

const updateProgramSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().optional().allow(""),
  pointsPerCurrency: Joi.number().min(0).optional(),
  currencyPerPoint: Joi.number().min(0).optional(),
  minRedemptionPoints: Joi.number().integer().min(1).optional(),
  expiryDays: Joi.number().integer().min(1).optional().allow(null),
  isActive: Joi.boolean().optional(),
});

// Loyalty Tier
const createTierSchema = Joi.object({
  programId: Joi.string().uuid().required(),
  name: Joi.string().required().min(2).max(50),
  minPoints: Joi.number().integer().min(0).required(),
  benefits: Joi.object().optional(),
  multiplier: Joi.number().min(1).max(10).default(1.0),
  color: Joi.string().optional().allow(""),
  sortOrder: Joi.number().integer().default(0),
});

const updateTierSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  minPoints: Joi.number().integer().min(0).optional(),
  benefits: Joi.object().optional().allow(null),
  multiplier: Joi.number().min(1).max(10).optional(),
  color: Joi.string().optional().allow(""),
  sortOrder: Joi.number().integer().optional(),
});

// Customer Loyalty
const enrollCustomerSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  programId: Joi.string().uuid().required(),
});

const adjustPointsSchema = Joi.object({
  points: Joi.number().integer().required(),
  description: Joi.string().optional().allow(""),
});

// Loyalty Transaction
const earnPointsSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  orderId: Joi.string().uuid().optional(),
  points: Joi.number().integer().min(1).required(),
  description: Joi.string().optional().allow(""),
});

const redeemPointsSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  rewardId: Joi.string().uuid().optional(),
  points: Joi.number().integer().min(1).required(),
  description: Joi.string().optional().allow(""),
});

// Loyalty Reward
const createRewardSchema = Joi.object({
  programId: Joi.string().uuid().required(),
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().optional().allow(""),
  pointsCost: Joi.number().integer().min(1).required(),
  rewardType: Joi.string()
    .valid("DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "FREE_ITEM", "VOUCHER")
    .required(),
  rewardValue: Joi.number().min(0).optional(),
  itemId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().default(true),
  maxRedemptions: Joi.number().integer().min(1).optional(),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().optional(),
});

const updateRewardSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().optional().allow(""),
  pointsCost: Joi.number().integer().min(1).optional(),
  rewardType: Joi.string()
    .valid("DISCOUNT_PERCENT", "DISCOUNT_AMOUNT", "FREE_ITEM", "VOUCHER")
    .optional(),
  rewardValue: Joi.number().min(0).optional().allow(null),
  itemId: Joi.string().uuid().optional().allow(null),
  isActive: Joi.boolean().optional(),
  maxRedemptions: Joi.number().integer().min(1).optional().allow(null),
  validFrom: Joi.date().optional().allow(null),
  validUntil: Joi.date().optional().allow(null),
});

// List/Search
const searchSchema = Joi.object({
  query: Joi.string().optional().allow(""),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = {
  createProgramSchema,
  updateProgramSchema,
  createTierSchema,
  updateTierSchema,
  enrollCustomerSchema,
  adjustPointsSchema,
  earnPointsSchema,
  redeemPointsSchema,
  createRewardSchema,
  updateRewardSchema,
  searchSchema,
};
