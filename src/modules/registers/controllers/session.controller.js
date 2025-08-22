const {
  openSessionSchema,
  closeSessionSchema,
  movementSchema,
} = require("../validators/session.schema");
const svc = require("../services/session.service");

async function listForRegister(req, res) {
  try {
    const data = await svc.listForRegister(req.params.id, {
      branchId: req.tenant.branchId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function get(req, res) {
  try {
    const data = await svc.get(req.params.sessionId, {
      branchId: req.tenant.branchId,
    });
    res.json({ data });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function open(req, res) {
  try {
    const { value, error } = openSessionSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.open(req.params.id, {
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
      openingFloat: value.openingFloat,
      userId: req.user.id,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function close(req, res) {
  try {
    const { value, error } = closeSessionSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.close(req.params.id, {
      branchId: req.tenant.branchId,
      userId: req.user.id,
      countedClose: value.countedClose,
      notes: value.notes || "",
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function createMovement(req, res) {
  try {
    const { value, error } = movementSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.createMovement(req.params.sessionId, {
      branchId: req.tenant.branchId,
      userId: req.user.id,
      ...value,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function summary(req, res) {
  try {
    const data = await svc.summary(req.params.sessionId, {
      branchId: req.tenant.branchId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { listForRegister, get, open, close, createMovement, summary };
