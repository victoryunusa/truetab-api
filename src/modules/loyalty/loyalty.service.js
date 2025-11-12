const { prisma } = require("../../lib/prisma");

// ============= LOYALTY PROGRAMS =============

/**
 * Create a loyalty program
 */
async function createLoyaltyProgram(data) {
  return await prisma.loyaltyProgram.create({
    data,
    include: {
      tiers: true,
    },
  });
}

/**
 * List loyalty programs for a brand
 */
async function listLoyaltyPrograms({ brandId, limit = 20, offset = 0 }) {
  const [programs, total] = await Promise.all([
    prisma.loyaltyProgram.findMany({
      where: { brandId },
      include: {
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            customers: true,
            transactions: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.loyaltyProgram.count({ where: { brandId } }),
  ]);

  return {
    programs,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Get loyalty program by ID
 */
async function getLoyaltyProgramById({ programId, brandId }) {
  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: programId, brandId },
    include: {
      tiers: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          customers: true,
          transactions: true,
          rewards: true,
        },
      },
    },
  });

  if (!program) {
    throw new Error("Loyalty program not found");
  }

  return program;
}

/**
 * Update loyalty program
 */
async function updateLoyaltyProgram({ programId, brandId, ...data }) {
  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: programId, brandId },
  });

  if (!program) {
    throw new Error("Loyalty program not found");
  }

  return await prisma.loyaltyProgram.update({
    where: { id: programId },
    data,
    include: {
      tiers: true,
    },
  });
}

/**
 * Delete loyalty program
 */
async function deleteLoyaltyProgram({ programId, brandId }) {
  const program = await prisma.loyaltyProgram.findFirst({
    where: { id: programId, brandId },
  });

  if (!program) {
    throw new Error("Loyalty program not found");
  }

  await prisma.loyaltyProgram.delete({
    where: { id: programId },
  });

  return { message: "Loyalty program deleted successfully" };
}

// ============= LOYALTY TIERS =============

/**
 * Create a loyalty tier
 */
async function createLoyaltyTier(data) {
  const program = await prisma.loyaltyProgram.findUnique({
    where: { id: data.programId },
  });

  if (!program) {
    throw new Error("Loyalty program not found");
  }

  return await prisma.loyaltyTier.create({
    data,
  });
}

/**
 * Update loyalty tier
 */
async function updateLoyaltyTier({ tierId, programId, ...data }) {
  const tier = await prisma.loyaltyTier.findFirst({
    where: { id: tierId, programId },
  });

  if (!tier) {
    throw new Error("Loyalty tier not found");
  }

  return await prisma.loyaltyTier.update({
    where: { id: tierId },
    data,
  });
}

/**
 * Delete loyalty tier
 */
async function deleteLoyaltyTier({ tierId, programId }) {
  const tier = await prisma.loyaltyTier.findFirst({
    where: { id: tierId, programId },
  });

  if (!tier) {
    throw new Error("Loyalty tier not found");
  }

  await prisma.loyaltyTier.delete({
    where: { id: tierId },
  });

  return { message: "Loyalty tier deleted successfully" };
}

// ============= CUSTOMER LOYALTY =============

/**
 * Enroll customer in loyalty program
 */
async function enrollCustomer({ customerId, programId, brandId }) {
  // Verify customer belongs to brand
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  // Check if already enrolled
  const existing = await prisma.customerLoyalty.findUnique({
    where: { customerId },
  });

  if (existing) {
    throw new Error("Customer already enrolled in a loyalty program");
  }

  return await prisma.customerLoyalty.create({
    data: {
      customerId,
      programId,
    },
    include: {
      program: true,
      tier: true,
    },
  });
}

/**
 * Get customer loyalty account
 */
async function getCustomerLoyalty({ customerId, brandId }) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const loyalty = await prisma.customerLoyalty.findUnique({
    where: { customerId },
    include: {
      program: {
        include: {
          tiers: {
            orderBy: { minPoints: "asc" },
          },
        },
      },
      tier: true,
    },
  });

  if (!loyalty) {
    throw new Error("Customer not enrolled in loyalty program");
  }

  return loyalty;
}

/**
 * Calculate appropriate tier for customer
 */
async function calculateTier(programId, points) {
  const tiers = await prisma.loyaltyTier.findMany({
    where: { programId },
    orderBy: { minPoints: "desc" },
  });

  for (const tier of tiers) {
    if (points >= tier.minPoints) {
      return tier.id;
    }
  }

  return null;
}

/**
 * Earn loyalty points
 */
async function earnPoints({ customerId, programId, orderId, points, description }) {
  const loyalty = await prisma.customerLoyalty.findUnique({
    where: { customerId },
  });

  if (!loyalty) {
    throw new Error("Customer not enrolled in loyalty program");
  }

  if (loyalty.programId !== programId) {
    throw new Error("Program mismatch");
  }

  const newPoints = loyalty.points + points;
  const newLifetimePoints = loyalty.lifetimePoints + points;

  // Calculate new tier
  const newTierId = await calculateTier(programId, newPoints);

  // Create transaction and update loyalty account
  const [transaction] = await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        customerId,
        programId,
        orderId,
        type: "EARNED",
        points,
        description,
      },
    }),
    prisma.customerLoyalty.update({
      where: { customerId },
      data: {
        points: newPoints,
        lifetimePoints: newLifetimePoints,
        tierId: newTierId,
        lastActivityAt: new Date(),
      },
    }),
  ]);

  return transaction;
}

/**
 * Redeem loyalty points
 */
async function redeemPoints({ customerId, programId, rewardId, points, description }) {
  const loyalty = await prisma.customerLoyalty.findUnique({
    where: { customerId },
    include: { program: true },
  });

  if (!loyalty) {
    throw new Error("Customer not enrolled in loyalty program");
  }

  if (loyalty.programId !== programId) {
    throw new Error("Program mismatch");
  }

  if (loyalty.points < points) {
    throw new Error("Insufficient points");
  }

  if (points < loyalty.program.minRedemptionPoints) {
    throw new Error(
      `Minimum redemption is ${loyalty.program.minRedemptionPoints} points`
    );
  }

  const newPoints = loyalty.points - points;
  const newTierId = await calculateTier(programId, newPoints);

  // Create transaction and update loyalty account
  const [transaction] = await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        customerId,
        programId,
        rewardId,
        type: "REDEEMED",
        points: -points,
        description,
      },
    }),
    prisma.customerLoyalty.update({
      where: { customerId },
      data: {
        points: newPoints,
        tierId: newTierId,
        lastActivityAt: new Date(),
      },
    }),
  ]);

  return transaction;
}

/**
 * Adjust customer points (admin only)
 */
async function adjustPoints({ customerId, programId, points, description }) {
  const loyalty = await prisma.customerLoyalty.findUnique({
    where: { customerId },
  });

  if (!loyalty) {
    throw new Error("Customer not enrolled in loyalty program");
  }

  const newPoints = Math.max(0, loyalty.points + points);
  const newTierId = await calculateTier(programId, newPoints);

  const [transaction] = await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        customerId,
        programId,
        type: "ADJUSTED",
        points,
        description,
      },
    }),
    prisma.customerLoyalty.update({
      where: { customerId },
      data: {
        points: newPoints,
        tierId: newTierId,
        lastActivityAt: new Date(),
      },
    }),
  ]);

  return transaction;
}

/**
 * Get customer loyalty transactions
 */
async function getCustomerTransactions({ customerId, brandId, limit = 20, offset = 0 }) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, brandId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const [transactions, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { customerId },
      include: {
        reward: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.loyaltyTransaction.count({ where: { customerId } }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

// ============= LOYALTY REWARDS =============

/**
 * Create loyalty reward
 */
async function createLoyaltyReward(data) {
  return await prisma.loyaltyReward.create({
    data,
  });
}

/**
 * List loyalty rewards
 */
async function listLoyaltyRewards({ programId, isActive, limit = 20, offset = 0 }) {
  const where = { programId };
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [rewards, total] = await Promise.all([
    prisma.loyaltyReward.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { pointsCost: "asc" },
    }),
    prisma.loyaltyReward.count({ where }),
  ]);

  return {
    rewards,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Update loyalty reward
 */
async function updateLoyaltyReward({ rewardId, programId, ...data }) {
  const reward = await prisma.loyaltyReward.findFirst({
    where: { id: rewardId, programId },
  });

  if (!reward) {
    throw new Error("Loyalty reward not found");
  }

  return await prisma.loyaltyReward.update({
    where: { id: rewardId },
    data,
  });
}

/**
 * Delete loyalty reward
 */
async function deleteLoyaltyReward({ rewardId, programId }) {
  const reward = await prisma.loyaltyReward.findFirst({
    where: { id: rewardId, programId },
  });

  if (!reward) {
    throw new Error("Loyalty reward not found");
  }

  await prisma.loyaltyReward.delete({
    where: { id: rewardId },
  });

  return { message: "Loyalty reward deleted successfully" };
}

module.exports = {
  createLoyaltyProgram,
  listLoyaltyPrograms,
  getLoyaltyProgramById,
  updateLoyaltyProgram,
  deleteLoyaltyProgram,
  createLoyaltyTier,
  updateLoyaltyTier,
  deleteLoyaltyTier,
  enrollCustomer,
  getCustomerLoyalty,
  earnPoints,
  redeemPoints,
  adjustPoints,
  getCustomerTransactions,
  createLoyaltyReward,
  listLoyaltyRewards,
  updateLoyaltyReward,
  deleteLoyaltyReward,
};
