const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireRole } = require("../../middleware/rbac");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./delivery.controller");

const adminGuards = [
  auth(true),
  tenant(true),
  requireActiveSubscription(),
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN"),
];

// Providers
router.get("/providers", ...adminGuards, ctrl.listProviders);

// Integrations
router.post("/integrations", ...adminGuards, ctrl.createIntegration);
router.get("/integrations", ...adminGuards, ctrl.listIntegrations);
router.get("/integrations/:id", ...adminGuards, ctrl.getIntegration);
router.put("/integrations/:id", ...adminGuards, ctrl.updateIntegration);
router.delete("/integrations/:id", ...adminGuards, ctrl.deleteIntegration);

// Delivery Orders
router.get("/orders", ...adminGuards, ctrl.listDeliveryOrders);
router.get("/orders/:id", ...adminGuards, ctrl.getDeliveryOrder);
router.patch("/orders/:id/status", ...adminGuards, ctrl.updateOrderStatus);

// Metrics
router.get("/metrics", ...adminGuards, ctrl.getMetrics);

module.exports = router;
