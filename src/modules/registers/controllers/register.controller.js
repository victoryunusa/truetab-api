const {
  createRegisterSchema,
  updateRegisterSchema,
} = require("../validators/register.schema");
const svc = require("../services/register.service");

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
    const { value, error } = createRegisterSchema.validate(req.body, {
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
    const { value, error } = updateRegisterSchema.validate(req.body, {
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

module.exports = { list, create, update };
