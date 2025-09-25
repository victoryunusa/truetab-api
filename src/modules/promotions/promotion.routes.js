const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireRole } = require("../../middleware/rbac");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./promotion.controller");

const guards = [
  auth(true),
  tenant(true),
  requireActiveSubscription(),
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN"),
];

// List promotions
router.get("/", ...guards, ctrl.listPromotions);

// Create promotion
router.post("/", ...guards, ctrl.createPromotion);

// Get specific promotion
router.get("/:id", ...guards, ctrl.getPromotion);

// Update promotion
router.put("/:id", ...guards, ctrl.updatePromotion);

// Delete promotion
router.delete("/:id", ...guards, ctrl.deletePromotion);

// Toggle promotion status (activate/deactivate)
router.patch("/:id/toggle", ...guards, ctrl.togglePromotionStatus);

module.exports = router;