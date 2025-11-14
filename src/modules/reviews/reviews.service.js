const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a review
 */
async function createReview(brandId, customerId, data) {
  // Verify order belongs to customer if orderId provided
  if (data.orderId) {
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        brandId,
        customerId,
      },
    });

    if (!order) {
      throw new Error("Order not found or does not belong to customer");
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId: data.orderId,
        customerId,
      },
    });

    if (existingReview) {
      throw new Error("Order has already been reviewed");
    }
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      brandId,
      customerId,
      orderId: data.orderId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      foodRating: data.foodRating,
      serviceRating: data.serviceRating,
      ambianceRating: data.ambianceRating,
      isVerified: !!data.orderId, // Verified if linked to order
      isPublished: true,
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Add media if provided
  if (data.media && data.media.length > 0) {
    await prisma.reviewMedia.createMany({
      data: data.media.map((m) => ({
        reviewId: review.id,
        type: m.type,
        url: m.url,
      })),
    });
  }

  return review;
}

/**
 * List reviews with filtering and pagination
 */
async function listReviews(brandId, options = {}) {
  const {
    page = 1,
    limit = 20,
    rating,
    isVerified,
    isPublished = true, // Default to published only
    customerId,
  } = options;
  const skip = (page - 1) * limit;

  const where = {
    brandId,
    ...(rating && { rating }),
    ...(isVerified !== undefined && { isVerified }),
    ...(isPublished !== undefined && { isPublished }),
    ...(customerId && { customerId }),
  };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
          },
        },
        response: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get review by ID
 */
async function getReviewById(reviewId, brandId) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, brandId },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
        },
      },
      response: true,
      media: true,
    },
  });

  return review;
}

/**
 * Update a review (customer can only update their own)
 */
async function updateReview(reviewId, customerId, data) {
  // Verify ownership
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.customerId !== customerId) {
    throw new Error("You can only update your own reviews");
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating && { rating: data.rating }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.comment !== undefined && { comment: data.comment }),
      ...(data.foodRating !== undefined && { foodRating: data.foodRating }),
      ...(data.serviceRating !== undefined && { serviceRating: data.serviceRating }),
      ...(data.ambianceRating !== undefined && { ambianceRating: data.ambianceRating }),
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      media: true,
    },
  });

  return updated;
}

/**
 * Delete a review
 */
async function deleteReview(reviewId, customerId, isAdmin = false) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  // Only customer who wrote it or admin can delete
  if (!isAdmin && review.customerId !== customerId) {
    throw new Error("You can only delete your own reviews");
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  return { success: true };
}

/**
 * Respond to a review (brand owner/admin)
 */
async function respondToReview(reviewId, brandId, message) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, brandId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  // Check if response already exists
  const existingResponse = await prisma.reviewResponse.findUnique({
    where: { reviewId },
  });

  if (existingResponse) {
    // Update existing response
    const updated = await prisma.reviewResponse.update({
      where: { reviewId },
      data: { message },
    });
    return updated;
  }

  // Create new response
  const response = await prisma.reviewResponse.create({
    data: {
      reviewId,
      message,
    },
  });

  return response;
}

/**
 * Moderate a review (admin only)
 */
async function moderateReview(reviewId, brandId, data) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, brandId },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      ...(data.isFlagged !== undefined && { isFlagged: data.isFlagged }),
      ...(data.flagReason !== undefined && { flagReason: data.flagReason }),
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Get review statistics for a brand
 */
async function getReviewStats(brandId) {
  const [totalReviews, avgRatings, ratingDistribution, recentReviews] = await Promise.all([
    // Total count
    prisma.review.count({
      where: { brandId, isPublished: true },
    }),

    // Average ratings
    prisma.review.aggregate({
      where: { brandId, isPublished: true },
      _avg: {
        rating: true,
        foodRating: true,
        serviceRating: true,
        ambianceRating: true,
      },
    }),

    // Rating distribution (1-5 stars)
    Promise.all([
      prisma.review.count({ where: { brandId, isPublished: true, rating: 5 } }),
      prisma.review.count({ where: { brandId, isPublished: true, rating: 4 } }),
      prisma.review.count({ where: { brandId, isPublished: true, rating: 3 } }),
      prisma.review.count({ where: { brandId, isPublished: true, rating: 2 } }),
      prisma.review.count({ where: { brandId, isPublished: true, rating: 1 } }),
    ]),

    // Recent reviews (last 10)
    prisma.review.findMany({
      where: { brandId, isPublished: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  // Calculate response rate
  const reviewsWithResponse = await prisma.review.count({
    where: {
      brandId,
      isPublished: true,
      response: {
        isNot: null,
      },
    },
  });

  const responseRate = totalReviews > 0 
    ? ((reviewsWithResponse / totalReviews) * 100).toFixed(2) 
    : 0;

  return {
    totalReviews,
    averageRating: avgRatings._avg.rating?.toFixed(2) || 0,
    averageFoodRating: avgRatings._avg.foodRating?.toFixed(2) || null,
    averageServiceRating: avgRatings._avg.serviceRating?.toFixed(2) || null,
    averageAmbianceRating: avgRatings._avg.ambianceRating?.toFixed(2) || null,
    ratingDistribution: {
      5: ratingDistribution[0],
      4: ratingDistribution[1],
      3: ratingDistribution[2],
      2: ratingDistribution[3],
      1: ratingDistribution[4],
    },
    responseRate: parseFloat(responseRate),
    recentReviews,
  };
}

/**
 * Get reviews for a specific order
 */
async function getOrderReviews(orderId, brandId) {
  const reviews = await prisma.review.findMany({
    where: {
      orderId,
      brandId,
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      response: true,
      media: true,
    },
  });

  return reviews;
}

module.exports = {
  createReview,
  listReviews,
  getReviewById,
  updateReview,
  deleteReview,
  respondToReview,
  moderateReview,
  getReviewStats,
  getOrderReviews,
};
