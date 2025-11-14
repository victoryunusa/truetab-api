const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireRole } = require("../../middleware/rbac");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./reviews.controller");

const adminGuards = [
  auth(true),
  tenant(true),
  requireActiveSubscription(),
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN"),
];

const authGuards = [
  auth(true),
  tenant(true),
  requireActiveSubscription(),
];

// Review CRUD
router.post("/", ...authGuards, ctrl.createReview); // Any authenticated user
router.get("/", tenant(true), ctrl.listReviews); // Public with brandId
router.get("/stats", ...adminGuards, ctrl.getReviewStats); // Admin only
router.get("/order/:orderId", ...authGuards, ctrl.getOrderReviews);
router.get("/:id", tenant(true), ctrl.getReview); // Public with brandId
router.put("/:id", ...authGuards, ctrl.updateReview); // Customer owner
router.delete("/:id", ...authGuards, ctrl.deleteReview); // Customer or Admin

// Brand Response & Moderation
router.post("/:id/response", ...adminGuards, ctrl.respondToReview); // Admin only
router.patch("/:id/moderate", ...adminGuards, ctrl.moderateReview); // Admin only

module.exports = router;
