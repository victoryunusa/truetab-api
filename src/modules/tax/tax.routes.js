const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./tax.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.get("/", guards, ctrl.list);
router.post("/", guards, ctrl.create);
router.patch("/:id", guards, ctrl.update);
router.delete("/:id", guards, ctrl.remove);

module.exports = router;
