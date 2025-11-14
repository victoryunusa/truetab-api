const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./kds.controller");

const guards = [
  auth(true),
  tenant(true),
  requireActiveSubscription(),
];

// Ticket Operations
router.get("/tickets", ...guards, ctrl.listTickets);
router.get("/tickets/:id", ...guards, ctrl.getTicket);
router.patch("/tickets/:id/accept", ...guards, ctrl.acceptTicket);
router.patch("/tickets/:id/start", ...guards, ctrl.startTicket);
router.patch("/tickets/:id/ready", ...guards, ctrl.markReady);
router.patch("/tickets/:id/serve", ...guards, ctrl.markServed);
router.patch("/tickets/:id/bump", ...guards, ctrl.bumpTicket);
router.patch("/tickets/:id/void", ...guards, ctrl.voidTicket);
router.patch("/tickets/:id/priority", ...guards, ctrl.setPriority);

// Metrics
router.get("/metrics/station/:stationId", ...guards, ctrl.getStationMetrics);
router.get("/metrics/branch", ...guards, ctrl.getBranchMetrics);

module.exports = router;
