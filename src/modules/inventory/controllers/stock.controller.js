const {
  createStockTxSchema,
  listStockTxQuerySchema,
} = require("../validators/stock.schema");
const svc = require("../services/stock.service");

async function list(req, res, next) {
  try {
    const { value, error } = listStockTxQuerySchema.validate(req.query);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const out = await svc.listTransactions(req.tenant.brandId, value);
    res.json(out);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { value, error } = createStockTxSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const out = await svc.createTransaction(
      req.tenant.brandId,
      value,
      req.user?.id
    );
    res.status(201).json(out);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
