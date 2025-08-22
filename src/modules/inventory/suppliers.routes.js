// src/modules/inventory/suppliers.routes.js
const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const ctrl = require("./controllers/supplier.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.get("/suppliers", ...guards, ctrl.list);
router.get("/suppliers/:id", ...guards, ctrl.get);
router.post("/suppliers", ...guards, ctrl.create);
router.patch("/suppliers/:id", ...guards, ctrl.update);
router.delete("/suppliers/:id", ...guards, ctrl.remove);

module.exports = router;
