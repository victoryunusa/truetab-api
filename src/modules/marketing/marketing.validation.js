const Joi = require("joi");

const campaignTypeEnum = [
  "PROMOTIONAL",
  "ANNOUNCEMENT",
  "LOYALTY_REWARD",
  "SEASONAL",
  "BRAND_AWARENESS",
  "RE_ENGAGEMENT",
  "PRODUCT_LAUNCH",
  "FEEDBACK",
];

const campaignChannelEnum = [
  "EMAIL",
  "SMS",
  "PUSH",
  "IN_APP",
  "SOCIAL_MEDIA",
  "QR_CODE",
  "WEBSITE_BANNER",
];

const campaignStatusEnum = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

const createCampaignSchema = Joi.object({
  name: Joi.string().required().min(3).max(255),
  description: Joi.string().optional().allow("").max(1000),
  type: Joi.string()
    .valid(...campaignTypeEnum)
    .required(),
  channel: Joi.string()
    .valid(...campaignChannelEnum)
    .required(),
  startDate: Joi.date().optional().iso(),
  endDate: Joi.date().optional().iso().greater(Joi.ref("startDate")),
  budget: Joi.number().optional().positive(),
  targetAudience: Joi.object().optional(),
  content: Joi.object({
    subject: Joi.string().when("$channel", {
      is: "EMAIL",
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    body: Joi.string().required(),
    htmlBody: Joi.string().optional(),
    previewText: Joi.string().optional(),
  }).required(),
  imageUrl: Joi.string().uri().optional().allow(""),
  callToAction: Joi.string().optional().max(100),
  link: Joi.string().uri().optional().allow(""),
  promoCode: Joi.string().optional().max(50),
});

const updateCampaignSchema = Joi.object({
  name: Joi.string().optional().min(3).max(255),
  description: Joi.string().optional().allow("").max(1000),
  type: Joi.string()
    .valid(...campaignTypeEnum)
    .optional(),
  channel: Joi.string()
    .valid(...campaignChannelEnum)
    .optional(),
  status: Joi.string()
    .valid(...campaignStatusEnum)
    .optional(),
  startDate: Joi.date().optional().iso(),
  endDate: Joi.date().optional().iso(),
  budget: Joi.number().optional().positive(),
  targetAudience: Joi.object().optional(),
  content: Joi.object({
    subject: Joi.string().optional(),
    body: Joi.string().optional(),
    htmlBody: Joi.string().optional(),
    previewText: Joi.string().optional(),
  }).optional(),
  imageUrl: Joi.string().uri().optional().allow(""),
  callToAction: Joi.string().optional().max(100),
  link: Joi.string().uri().optional().allow(""),
  promoCode: Joi.string().optional().max(50),
});

const addAudienceSchema = Joi.object({
  customers: Joi.array()
    .items(Joi.string().uuid())
    .optional()
    .min(1),
  segments: Joi.object({
    newCustomers: Joi.boolean().optional(),
    loyaltyTier: Joi.string().optional(),
    minSpending: Joi.number().optional(),
    lastOrderDays: Joi.number().optional(),
    location: Joi.string().optional(),
  }).optional(),
  emails: Joi.array()
    .items(Joi.string().email())
    .optional()
    .min(1),
  phones: Joi.array()
    .items(Joi.string().pattern(/^[\d\s\-\+\(\)]+$/))
    .optional()
    .min(1),
}).or("customers", "segments", "emails", "phones");

const trackEngagementSchema = Joi.object({
  eventType: Joi.string()
    .valid("SENT", "DELIVERED", "OPENED", "CLICKED", "CONVERTED", "BOUNCED", "UNSUBSCRIBED", "COMPLAINT")
    .required(),
  email: Joi.string().email().optional(),
  customerId: Joi.string().uuid().optional(),
  eventData: Joi.object().optional(),
  ipAddress: Joi.string().ip().optional(),
  userAgent: Joi.string().optional(),
}).or("email", "customerId");

module.exports = {
  createCampaignSchema,
  updateCampaignSchema,
  addAudienceSchema,
  trackEngagementSchema,
};
