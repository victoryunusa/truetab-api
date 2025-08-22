const { createPOSchema, receivePOSchema } = require("../validators/po.schema");
const svc = require("../services/po.service");

async function create(req, res, next) {
  try {
    const { value, error } = createPOSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const po = await svc.createPO(
      req.tenant.brandId,
      value.supplierId,
      value.items,
      req.user?.id
    );
    res.status(201).json({ data: po });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const pos = await svc.listPOs(req.tenant.brandId);
    res.json({ data: pos });
  } catch (err) {
    next(err);
  }
}

async function receive(req, res, next) {
  try {
    const { value, error } = receivePOSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const po = await svc.receivePO(
      req.tenant.brandId,
      req.params.id,
      value.items,
      req.user?.id
    );
    res.json({ data: po });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, receive };
