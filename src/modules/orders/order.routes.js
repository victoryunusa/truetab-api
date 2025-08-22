// src/modules/orders/order.routes.js
const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");

const ctrl = require("./order.controller");
const pay = require("./payment.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

// Orders
router.post("/", guards, ctrl.create);
router.get("/", guards, ctrl.list);
router.get("/:id", guards, ctrl.get);
router.patch("/:id", guards, ctrl.update); // change table, waiter, notes, etc
router.patch("/:id/status", guards, ctrl.updateStatus);
router.post("/:id/items", guards, ctrl.addItems);
router.patch("/:id/items/:orderItemId", guards, ctrl.updateItem);
router.delete("/:id/items/:orderItemId", guards, ctrl.removeItem);

// Promotions (optional; no-op if none found)
router.post("/:id/apply-promo", guards, ctrl.applyPromo);
router.delete("/:id/remove-promo", guards, ctrl.removePromo);

// Payments
router.post("/:id/payments", guards, pay.takePayment);
router.post("/payments/:paymentId/refunds", guards, pay.refund);

module.exports = router;
