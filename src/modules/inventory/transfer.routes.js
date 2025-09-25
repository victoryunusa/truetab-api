const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./controllers/transfer.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

// Create transfer
router.post("/transfers", ...guards, ctrl.createTransfer);

// Complete transfer
router.post("/transfers/:id/complete", ...guards, ctrl.completeTransfer);

// List transfers
router.get("/transfers", ...guards, ctrl.listTransfers);

module.exports = router;
