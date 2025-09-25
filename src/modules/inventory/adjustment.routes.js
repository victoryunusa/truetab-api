const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./controllers/adjustment.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.post("/adjustments", ...guards, ctrl.createAdjustment);
router.get("/adjustments", ...guards, ctrl.listAdjustments);

module.exports = router;
