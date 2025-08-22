// src/modules/inventory/controllers/supplier.controller.js
const {
  createSupplierSchema,
  updateSupplierSchema,
  listSupplierQuerySchema,
} = require("../validators/supplier.schema");
const svc = require("../services/supplier.service");

// GET /suppliers
async function list(req, res, next) {
  try {
    const { value, error } = listSupplierQuerySchema.validate(req.query, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const out = await svc.listSuppliers(req.tenant.brandId, value);
    res.json(out);
  } catch (err) {
    next(err);
  }
}

// GET /suppliers/:id
async function get(req, res, next) {
  try {
    const data = await svc.getSupplier(req.tenant.brandId, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// POST /suppliers
async function create(req, res, next) {
  try {
    const { value, error } = createSupplierSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.createSupplier(
      req.tenant.brandId,
      value,
      req.user?.id
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

// PATCH /suppliers/:id
async function update(req, res, next) {
  try {
    const { value, error } = updateSupplierSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.updateSupplier(
      req.tenant.brandId,
      req.params.id,
      value,
      req.user?.id
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// DELETE /suppliers/:id
// Optional query ?hardDelete=true
async function remove(req, res, next) {
  try {
    const hardDelete =
      String(req.query.hardDelete || "").toLowerCase() === "true";
    const data = await svc.deleteSupplier(
      req.tenant.brandId,
      req.params.id,
      req.user?.id,
      { hardDelete }
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
