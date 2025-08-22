const svc = require("./tip-settlement.service");

async function settle(req, res) {
  try {
    const data = await svc.settle({
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
      registerId: req.body.registerId || null,
      rule: req.body.rule || "EQUAL",
    });
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function list(req, res) {
  const data = await svc.list({
    brandId: req.tenant.brandId,
    branchId: req.tenant.branchId,
  });
  res.json({ data });
}

module.exports = { settle, list };
