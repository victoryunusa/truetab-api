// src/modules/orders/payment.controller.js
const paySvc = require("./payment.service");

async function takePayment(req, res) {
  const data = await paySvc.takePayment(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
    body: req.body, // { method, amount, tipAmount?, reference?, metadata?, sessionId? }
  });
  res.status(201).json({ data });
}

async function refund(req, res) {
  const data = await paySvc.refund(req.params.paymentId, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
    body: req.body, // { amount, reason }
  });
  res.status(201).json({ data });
}

module.exports = { takePayment, refund };
