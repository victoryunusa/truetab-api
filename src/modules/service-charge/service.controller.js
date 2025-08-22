const svc = require("./service.service");
const { upsertServiceSchema } = require("./service.schema");

async function get(req, res) {
  const data = await svc.getForBranch(req.params.branchId);
  res.json({ data });
}

async function upsert(req, res) {
  const { value, error } = upsertServiceSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({ error: error.details.map((d) => d.message) });

  const data = await svc.upsertForBranch(req.params.branchId, value);
  res.status(201).json({ data });
}

module.exports = { get, upsert };
