const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./tip-settlement.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

// Settlement
router.post("/", guards, ctrl.settle);
router.get("/", guards, ctrl.list);

module.exports = router;
