const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireRole } = require("../../middleware/rbac");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./marketing.controller");

const guards = [
  auth(true),
  tenant(true),
  requireActiveSubscription(),
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN"),
];

// Campaign CRUD
router.get("/campaigns", ...guards, ctrl.listCampaigns);
router.post("/campaigns", ...guards, ctrl.createCampaign);
router.get("/campaigns/:id", ...guards, ctrl.getCampaign);
router.put("/campaigns/:id", ...guards, ctrl.updateCampaign);
router.delete("/campaigns/:id", ...guards, ctrl.deleteCampaign);

// Campaign Audience Management
router.post("/campaigns/:id/audience", ...guards, ctrl.addAudience);
router.get("/campaigns/:id/audience", ...guards, ctrl.getCampaignAudience);

// Campaign Analytics
router.get("/campaigns/:id/analytics", ...guards, ctrl.getCampaignAnalytics);

// Campaign Engagement Tracking (can be public for tracking pixels, webhooks, etc.)
router.post("/campaigns/:id/track", ctrl.trackEngagement);

module.exports = router;
