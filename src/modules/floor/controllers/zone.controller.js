const {
  createZoneSchema,
  updateZoneSchema,
} = require("../validators/zone.schema");
const svc = require("../services/zone.service");

async function list(req, res) {
  try {
    const data = await svc.list({
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function create(req, res) {
  try {
    const { value, error } = createZoneSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const branchId = value.branchId || req.tenant.branchId;
    const out = await svc.create({
      brandId: req.tenant.brandId,
      branchId,
      name: value.name,
      isActive: value.isActive ?? true,
    });
    res.status(201).json({ data: out });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function update(req, res) {
  try {
    const { value, error } = updateZoneSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const out = await svc.update(req.params.id, {
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
      ...value,
    });
    res.json({ data: out });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function remove(req, res) {
  try {
    await svc.remove(req.params.id, {
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
    });
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { list, create, update, remove };
