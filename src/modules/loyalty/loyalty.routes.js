const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const { requireRole } = require("../../middleware/rbac");

const {
  createProgramController,
  listProgramsController,
  getProgramController,
  updateProgramController,
  deleteProgramController,
  createTierController,
  updateTierController,
  deleteTierController,
  enrollCustomerController,
  getCustomerLoyaltyController,
  earnPointsController,
  redeemPointsController,
  adjustPointsController,
  getCustomerTransactionsController,
  createRewardController,
  listRewardsController,
  updateRewardController,
  deleteRewardController,
} = require("./loyalty.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];
const adminGuards = [
  ...guards,
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER"),
];

// ========== LOYALTY PROGRAMS ==========
router.get("/programs", guards, listProgramsController);
router.post("/programs", adminGuards, createProgramController);
router.get("/programs/:id", guards, getProgramController);
router.patch("/programs/:id", adminGuards, updateProgramController);
router.delete("/programs/:id", adminGuards, deleteProgramController);

// ========== LOYALTY TIERS ==========
router.post("/programs/:id/tiers", adminGuards, createTierController);
router.patch("/programs/:id/tiers/:tierId", adminGuards, updateTierController);
router.delete("/programs/:id/tiers/:tierId", adminGuards, deleteTierController);

// ========== CUSTOMER LOYALTY ==========
router.post("/enroll", guards, enrollCustomerController);
router.get("/customers/:customerId", guards, getCustomerLoyaltyController);
router.get("/customers/:customerId/transactions", guards, getCustomerTransactionsController);

// ========== POINTS TRANSACTIONS ==========
router.post("/programs/:id/earn", guards, earnPointsController);
router.post("/programs/:id/redeem", guards, redeemPointsController);
router.post("/programs/:id/customers/:customerId/adjust", adminGuards, adjustPointsController);

// ========== LOYALTY REWARDS ==========
router.get("/programs/:id/rewards", guards, listRewardsController);
router.post("/programs/:id/rewards", adminGuards, createRewardController);
router.patch("/programs/:id/rewards/:rewardId", adminGuards, updateRewardController);
router.delete("/programs/:id/rewards/:rewardId", adminGuards, deleteRewardController);

module.exports = router;
