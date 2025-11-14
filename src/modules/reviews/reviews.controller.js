const svc = require("./reviews.service");
const {
  createReviewSchema,
  updateReviewSchema,
  respondToReviewSchema,
  moderateReviewSchema,
} = require("./reviews.validation");

async function createReview(req, res, next) {
  try {
    const { value, error } = createReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const review = await svc.createReview(
      req.tenant.brandId,
      req.user.id,
      value
    );
    res.status(201).json({ data: review });
  } catch (err) {
    next(err);
  }
}

async function listReviews(req, res, next) {
  try {
    const { page, limit, rating, isVerified, isPublished, customerId } = req.query;
    
    const result = await svc.listReviews(req.tenant.brandId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      rating: rating ? parseInt(rating) : undefined,
      isVerified: isVerified === "true",
      isPublished: isPublished === undefined ? true : isPublished === "true",
      customerId,
    });
    
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getReview(req, res, next) {
  try {
    const review = await svc.getReviewById(req.params.id, req.tenant.brandId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json({ data: review });
  } catch (err) {
    next(err);
  }
}

async function updateReview(req, res, next) {
  try {
    const { value, error } = updateReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const review = await svc.updateReview(req.params.id, req.user.id, value);
    res.json({ data: review });
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    // Check if user is admin
    const isAdmin = ["SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN"].includes(req.user.role);
    
    await svc.deleteReview(req.params.id, req.user.id, isAdmin);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function respondToReview(req, res, next) {
  try {
    const { value, error } = respondToReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const response = await svc.respondToReview(
      req.params.id,
      req.tenant.brandId,
      value.message
    );
    res.json({ data: response });
  } catch (err) {
    next(err);
  }
}

async function moderateReview(req, res, next) {
  try {
    const { value, error } = moderateReviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map((d) => d.message) });
    }

    const review = await svc.moderateReview(
      req.params.id,
      req.tenant.brandId,
      value
    );
    res.json({ data: review });
  } catch (err) {
    next(err);
  }
}

async function getReviewStats(req, res, next) {
  try {
    const stats = await svc.getReviewStats(req.tenant.brandId);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

async function getOrderReviews(req, res, next) {
  try {
    const reviews = await svc.getOrderReviews(req.params.orderId, req.tenant.brandId);
    res.json({ data: reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  listReviews,
  getReview,
  updateReview,
  deleteReview,
  respondToReview,
  moderateReview,
  getReviewStats,
  getOrderReviews,
};
