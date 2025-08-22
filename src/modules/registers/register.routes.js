const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const { requireRole } = require("../../middleware/rbac");

const regCtrl = require("./controllers/register.controller");
const sesCtrl = require("./controllers/session.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

// Registers
router.get("/", guards, regCtrl.list);
router.post(
  "/",
  guards,
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER"),
  regCtrl.create
);
router.patch(
  "/:id",
  guards,
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER"),
  regCtrl.update
);

// Sessions
router.get("/:id/sessions", guards, sesCtrl.listForRegister);
router.post(
  "/:id/open",
  guards,
  requireRole(
    "SUPER_ADMIN",
    "BRAND_OWNER",
    "BRAND_ADMIN",
    "BRANCH_MANAGER",
    "STAFF"
  ),
  sesCtrl.open
);
router.post(
  "/:id/close",
  guards,
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER"),
  sesCtrl.close
);
router.get("/sessions/:sessionId", guards, sesCtrl.get);
router.post(
  "/sessions/:sessionId/movements",
  guards,
  requireRole(
    "SUPER_ADMIN",
    "BRAND_OWNER",
    "BRAND_ADMIN",
    "BRANCH_MANAGER",
    "STAFF"
  ),
  sesCtrl.createMovement
);
router.get("/sessions/:sessionId/summary", guards, sesCtrl.summary);

module.exports = router;
