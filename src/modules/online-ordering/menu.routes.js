const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const menuController = require("./menu.controller");

// Public routes (no auth required)
router.get("/public/:urlSlug", menuController.getPublicMenu);

// Protected routes (require auth)
router.post(
  "/create",
  auth(true),
  tenant(true),
  menuController.createMenu
);

router.get(
  "/:brandId",
  auth(true),
  tenant(true),
  menuController.getBrandMenu
);

router.patch(
  "/:menuId/settings",
  auth(true),
  tenant(true),
  menuController.updateSettings
);

router.post(
  "/:menuId/regenerate-qr",
  auth(true),
  tenant(true),
  menuController.regenerateQR
);

router.patch(
  "/:menuId/toggle",
  auth(true),
  tenant(true),
  menuController.toggleStatus
);

module.exports = router;
