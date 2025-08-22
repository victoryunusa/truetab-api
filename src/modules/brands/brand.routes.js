const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/rbac");
const {
  createBrandController,
  listBrandsController,
} = require("./brand.controller");

// Create brand (SuperAdmin or BrandOwner)
router.post(
  "/",
  auth(true),
  requireRole("SUPER_ADMIN", "BRAND_OWNER"),
  createBrandController
);

// List brands (SuperAdmin sees all; others see owned/assigned)
router.get("/", auth(true), listBrandsController);

module.exports = router;
