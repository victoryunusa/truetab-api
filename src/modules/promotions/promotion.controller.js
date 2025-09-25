const svc = require("./promotion.service");
const { createPromotionSchema, updatePromotionSchema } = require("./promotion.validation");

async function createPromotion(req, res, next) {
  try {
    const { value, error } = createPromotionSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const promotion = await svc.createPromotion(req.tenant.brandId, {
      ...value,
      createdBy: req.user.id,
    });
    res.status(201).json({ data: promotion });
  } catch (err) {
    next(err);
  }
}

async function listPromotions(req, res, next) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const promotions = await svc.listPromotions(req.tenant.brandId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });
    res.json({ data: promotions });
  } catch (err) {
    next(err);
  }
}

async function getPromotion(req, res, next) {
  try {
    const promotion = await svc.getPromotionById(req.params.id, req.tenant.brandId);
    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }
    res.json({ data: promotion });
  } catch (err) {
    next(err);
  }
}

async function updatePromotion(req, res, next) {
  try {
    const { value, error } = updatePromotionSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const promotion = await svc.updatePromotion(req.params.id, req.tenant.brandId, value);
    res.json({ data: promotion });
  } catch (err) {
    next(err);
  }
}

async function deletePromotion(req, res, next) {
  try {
    await svc.deletePromotion(req.params.id, req.tenant.brandId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function togglePromotionStatus(req, res, next) {
  try {
    const promotion = await svc.togglePromotionStatus(req.params.id, req.tenant.brandId);
    res.json({ data: promotion });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPromotion,
  listPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
};