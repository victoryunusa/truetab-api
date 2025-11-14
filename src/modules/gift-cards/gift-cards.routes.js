const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireRole } = require("../../middleware/rbac");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./gift-cards.controller");

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

// Gift Card Operations
router.post("/", ...authGuards, ctrl.purchaseGiftCard); // Any authenticated user can purchase
router.get("/", ...adminGuards, ctrl.listGiftCards); // Admin only
router.get("/:code/balance", ctrl.checkBalance); // Public - no auth needed
router.post("/redeem", ...authGuards, ctrl.redeemGiftCard);
router.get("/:code/history", ...authGuards, ctrl.getTransactionHistory);

// Store Credit Operations
router.post("/store-credit", ...adminGuards, ctrl.issueStoreCredit); // Admin only
router.get("/store-credit/customer/:customerId", ...authGuards, ctrl.getCustomerStoreCredit);
router.post("/store-credit/apply", ...authGuards, ctrl.applyStoreCredit);

module.exports = router;
