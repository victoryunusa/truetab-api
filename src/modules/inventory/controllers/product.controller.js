const {
  createProductSchema,
  updateProductSchema,
  listProductQuerySchema,
} = require("../validators/product.schema");
const svc = require("../services/product.service");

async function list(req, res, next) {
  try {
    const { value, error } = listProductQuerySchema.validate(req.query);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const out = await svc.listProducts(req.tenant.brandId, value);
    res.json(out);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const data = await svc.getProduct(req.tenant.brandId, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { value, error } = createProductSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.createProduct(
      req.tenant.brandId,
      value,
      req.user?.id
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { value, error } = updateProductSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.updateProduct(
      req.tenant.brandId,
      req.params.id,
      value,
      req.user?.id
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const data = await svc.deleteProduct(
      req.tenant.brandId,
      req.params.id,
      req.user?.id
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, remove };
