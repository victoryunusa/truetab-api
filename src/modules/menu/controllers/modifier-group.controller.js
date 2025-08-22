const {
  createGroupSchema,
  updateGroupSchema,
} = require("../validators/modifier.schema");
const svc = require("../services/modifier-group.service");

async function list(req, res) {
  const data = await svc.list({ brandId: req.tenant.brandId });
  res.json({ data });
}
async function create(req, res) {
  const { value, error } = createGroupSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.create({ brandId: req.tenant.brandId, ...value });
  res.status(201).json({ data });
}
async function update(req, res) {
  const { value, error } = updateGroupSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });
  const data = await svc.update(req.params.id, {
    brandId: req.tenant.brandId,
    ...value,
  });
  res.json({ data });
}
async function remove(req, res) {
  await svc.remove(req.params.id, { brandId: req.tenant.brandId });
  res.status(204).send();
}

module.exports = { list, create, update, remove };
