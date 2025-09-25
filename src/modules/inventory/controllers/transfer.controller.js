const svc = require("../services/transfer.service");
const { transferSchema, completeTransferSchema } = require("../validators/transfer.schema");

async function createTransfer(req, res, next) {
  try {
    const { value, error } = transferSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await svc.createTransfer(req.tenant.brandId, {
      ...value,
      userId: req.user.id,
    });
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

async function completeTransfer(req, res, next) {
  try {
    const { value, error } = completeTransferSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const data = await svc.completeTransfer(
      req.params.id,
      req.tenant.brandId,
      req.user.id,
      value
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function listTransfers(req, res, next) {
  try {
    const data = await svc.listTransfers(req.tenant.brandId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTransfer, completeTransfer, listTransfers };