const svc = require("../services/adjustment.service");
const { adjustmentSchema } = require("../validators/adjustment.schema");

async function createAdjustment(req, res, next) {
  try {
    const { value, error } = adjustmentSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await svc.createAdjustment(req.tenant.brandId, {
      ...value,
      userId: req.user.id,
    });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

async function listAdjustments(req, res, next) {
  try {
    const data = await svc.listAdjustments(req.tenant.brandId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createAdjustment, listAdjustments };