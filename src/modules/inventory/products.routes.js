const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./controllers/product.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.get("/products", ...guards, ctrl.list);
router.get("/products/:id", ...guards, ctrl.get);
router.post("/products", ...guards, ctrl.create);
router.patch("/products/:id", ...guards, ctrl.update);
router.delete("/products/:id", ...guards, ctrl.remove);

module.exports = router;
