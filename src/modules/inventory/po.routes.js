const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./controllers/po.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.get("/purchase-orders", ...guards, ctrl.list);
router.post("/purchase-orders", ...guards, ctrl.create);
router.post("/purchase-orders/:id/receive", ...guards, ctrl.receive);

module.exports = router;
