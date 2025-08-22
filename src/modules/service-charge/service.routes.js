const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./service.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.get("/:branchId", guards, ctrl.get);
router.post("/:branchId", guards, ctrl.upsert);

module.exports = router;
