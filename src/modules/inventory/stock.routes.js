const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./controllers/stock.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.get("/stock/transactions", ...guards, ctrl.list);
router.post("/stock/transactions", ...guards, ctrl.create);

module.exports = router;
