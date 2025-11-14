const Joi = require("joi");

const createReviewSchema = Joi.object({
  orderId: Joi.string().uuid().optional(),
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().max(255).optional().allow(""),
  comment: Joi.string().max(2000).optional().allow(""),
  foodRating: Joi.number().integer().min(1).max(5).optional(),
  serviceRating: Joi.number().integer().min(1).max(5).optional(),
  ambianceRating: Joi.number().integer().min(1).max(5).optional(),
  media: Joi.array().items(Joi.object({
    type: Joi.string().valid("IMAGE", "VIDEO").required(),
    url: Joi.string().uri().required(),
  })).optional(),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  title: Joi.string().max(255).optional().allow(""),
  comment: Joi.string().max(2000).optional().allow(""),
  foodRating: Joi.number().integer().min(1).max(5).optional(),
  serviceRating: Joi.number().integer().min(1).max(5).optional(),
  ambianceRating: Joi.number().integer().min(1).max(5).optional(),
});

const respondToReviewSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
});

const moderateReviewSchema = Joi.object({
  isPublished: Joi.boolean().optional(),
  isFlagged: Joi.boolean().optional(),
  flagReason: Joi.string().max(500).optional().allow(""),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  respondToReviewSchema,
  moderateReviewSchema,
};
