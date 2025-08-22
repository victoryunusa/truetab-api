// src/modules/orders/order.controller.js
const svc = require("./order.service");

async function create(req, res) {
  const data = await svc.create({
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
    payload: req.body, // { type, tableId, customerId, waiterId, covers, items[], notes, discountCode? }
  });
  res.status(201).json({ data });
}

async function list(req, res) {
  const data = await svc.list({
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    query: req.query,
  });
  res.json({ data });
}

async function get(req, res) {
  const data = await svc.get(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

async function update(req, res) {
  const data = await svc.update(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
    patch: req.body, // partial fields: tableId, waiterId, covers, notes
  });
  res.json({ data });
}

async function updateStatus(req, res) {
  const data = await svc.updateStatus(req.params.id, req.body.status, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
  });
  res.json({ data });
}

async function addItems(req, res) {
  const data = await svc.addItems(req.params.id, req.body.items, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
  });
  res.status(201).json({ data });
}

async function updateItem(req, res) {
  const data = await svc.updateItem(
    req.params.id,
    req.params.orderItemId,
    req.body,
    {
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
      userId: req.user.id,
    }
  );
  res.json({ data });
}

async function removeItem(req, res) {
  const data = await svc.removeItem(req.params.id, req.params.orderItemId, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
  });
  res.json({ data });
}

async function applyPromo(req, res) {
  const data = await svc.applyPromo(req.params.id, req.body.code, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
  });
  res.json({ data });
}

async function removePromo(req, res) {
  const data = await svc.removePromo(req.params.id, {
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    userId: req.user.id,
  });
  res.json({ data });
}

module.exports = {
  create,
  list,
  get,
  update,
  updateStatus,
  addItems,
  updateItem,
  removeItem,
  applyPromo,
  removePromo,
};
