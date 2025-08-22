const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/rbac");
const { tenant } = require("../../middleware/tenant");
const {
  requireActiveSubscription,
  enforcePlanLimit,
} = require("../../middleware/subscription");
const {
  createBranchController,
  listBranchesController,
} = require("./branch.controller");

// List branches in brand scope
router.get(
  "/",
  auth(true),
  tenant(true),
  requireActiveSubscription(),
  listBranchesController
);

// Create branch with plan limit check
router.post(
  "/",
  auth(true),
  tenant(true),
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN"),
  requireActiveSubscription(),
  enforcePlanLimit("maxBranches", async (req) => {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    return prisma.branch.count({ where: { brandId: req.tenant.brandId } });
  }),
  createBranchController
);

module.exports = router;
