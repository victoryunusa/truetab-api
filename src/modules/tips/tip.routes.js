const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./tip.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.get("/", guards, ctrl.list);
router.post("/", guards, ctrl.create);
router.get("/summary", guards, ctrl.summary);

module.exports = router;
