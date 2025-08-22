const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/rbac");
const {
  listPlansController,
  subscribeBrandController,
  startTrialController,
  getBrandSubscriptionController,
} = require("./subscription.controller");

// Public list plans
router.get("/plans", listPlansController);

// Brand subscription ops
router.post(
  "/brands/:brandId/subscribe",
  auth(true),
  requireRole("SUPER_ADMIN", "BRAND_OWNER"),
  subscribeBrandController
);

router.post(
  "/brands/:brandId/trial",
  auth(true),
  requireRole("SUPER_ADMIN", "BRAND_OWNER"),
  startTrialController
);

router.get(
  "/brands/:brandId",
  auth(true),
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN"),
  getBrandSubscriptionController
);

module.exports = router;
