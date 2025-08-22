const { createTipSchema } = require("./tip.validators");
const svc = require("./tip.service");

async function list(req, res) {
  const data = await svc.list({
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

async function create(req, res) {
  const { value, error } = createTipSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });

  const data = await svc.create({
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
    ...value,
  });
  res.status(201).json({ data });
}

async function summary(req, res) {
  const data = await svc.summary({
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

module.exports = { list, create, summary };
