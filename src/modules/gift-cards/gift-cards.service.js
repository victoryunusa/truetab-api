const { PrismaClient } = require("@prisma/client");
const { nanoid } = require("nanoid");
const prisma = new PrismaClient();

/**
 * Generate a unique gift card code
 */
function generateGiftCardCode() {
  // Format: TTGC-XXXX-XXXX-XXXX (TrueTab Gift Card)
  const part1 = nanoid(4).toUpperCase();
  const part2 = nanoid(4).toUpperCase();
  const part3 = nanoid(4).toUpperCase();
  return `TTGC-${part1}-${part2}-${part3}`;
}

/**
 * Purchase a gift card
 */
async function purchaseGiftCard(brandId, purchaserId, data) {
  const code = generateGiftCardCode();
  
  // Calculate expiration date
  let expiresAt = null;
  if (data.expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
  }

  // Get brand currency
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { currency: true },
  });

  const giftCard = await prisma.giftCard.create({
    data: {
      brandId,
      code,
      initialAmount: data.amount,
      balance: data.amount,
      currency: brand.currency,
      purchasedBy: purchaserId,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      message: data.message,
      expiresAt,
      status: "ACTIVE",
    },
  });

  // Create initial transaction
  await prisma.giftCardTransaction.create({
    data: {
      giftCardId: giftCard.id,
      type: "PURCHASE",
      amount: data.amount,
      balance: data.amount,
      note: "Gift card purchased",
    },
  });

  // TODO: Send email/SMS to recipient if provided
  // await sendGiftCardNotification(giftCard);

  return giftCard;
}

/**
 * Check gift card balance
 */
async function checkBalance(code) {
  const giftCard = await prisma.giftCard.findUnique({
    where: { code },
    select: {
      code: true,
      balance: true,
      currency: true,
      status: true,
      expiresAt: true,
      recipientName: true,
    },
  });

  if (!giftCard) {
    throw new Error("Gift card not found");
  }

  // Check if expired
  if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
    await prisma.giftCard.update({
      where: { code },
      data: { status: "EXPIRED" },
    });
    giftCard.status = "EXPIRED";
  }

  return giftCard;
}

/**
 * Redeem gift card (full or partial)
 */
async function redeemGiftCard(code, amount, orderId) {
  return await prisma.$transaction(async (tx) => {
    // Get gift card with lock
    const giftCard = await tx.giftCard.findUnique({
      where: { code },
    });

    if (!giftCard) {
      throw new Error("Gift card not found");
    }

    // Validate status
    if (giftCard.status !== "ACTIVE") {
      throw new Error(`Gift card is ${giftCard.status.toLowerCase()}`);
    }

    // Check expiration
    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      await tx.giftCard.update({
        where: { code },
        data: { status: "EXPIRED" },
      });
      throw new Error("Gift card has expired");
    }

    // Validate amount
    if (amount > giftCard.balance) {
      throw new Error(`Insufficient balance. Available: ${giftCard.balance}`);
    }

    // Calculate new balance
    const newBalance = giftCard.balance - amount;
    const newStatus = newBalance === 0 ? "REDEEMED" : "ACTIVE";

    // Update gift card
    const updated = await tx.giftCard.update({
      where: { code },
      data: {
        balance: newBalance,
        status: newStatus,
      },
    });

    // Create transaction record
    await tx.giftCardTransaction.create({
      data: {
        giftCardId: giftCard.id,
        orderId,
        type: "REDEMPTION",
        amount: -amount,
        balance: newBalance,
        note: `Redeemed ${amount} for order`,
      },
    });

    return {
      giftCard: updated,
      redeemedAmount: amount,
      remainingBalance: newBalance,
    };
  });
}

/**
 * Get gift card transaction history
 */
async function getTransactionHistory(code) {
  const giftCard = await prisma.giftCard.findUnique({
    where: { code },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!giftCard) {
    throw new Error("Gift card not found");
  }

  return {
    code: giftCard.code,
    initialAmount: giftCard.initialAmount,
    currentBalance: giftCard.balance,
    status: giftCard.status,
    transactions: giftCard.transactions,
  };
}

/**
 * List gift cards (Admin)
 */
async function listGiftCards(brandId, options = {}) {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;

  const where = {
    brandId,
    ...(status && { status }),
  };

  const [giftCards, total] = await Promise.all([
    prisma.giftCard.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.giftCard.count({ where }),
  ]);

  return {
    giftCards,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// Store Credit Functions
// ============================================

/**
 * Issue store credit to a customer
 */
async function issueStoreCredit(brandId, data) {
  const { customerId, amount, reason, expiresInDays } = data;

  // Get brand currency
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { currency: true },
  });

  let expiresAt = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  return await prisma.$transaction(async (tx) => {
    // Get or create store credit record
    let storeCredit = await tx.storeCredit.findUnique({
      where: {
        brandId_customerId: {
          brandId,
          customerId,
        },
      },
    });

    if (!storeCredit) {
      storeCredit = await tx.storeCredit.create({
        data: {
          brandId,
          customerId,
          balance: amount,
          currency: brand.currency,
          reason,
          expiresAt,
        },
      });
    } else {
      storeCredit = await tx.storeCredit.update({
        where: { id: storeCredit.id },
        data: {
          balance: storeCredit.balance + amount,
        },
      });
    }

    // Create transaction
    await tx.storeCreditTransaction.create({
      data: {
        storeCreditId: storeCredit.id,
        type: "CREDIT",
        amount: amount,
        balance: storeCredit.balance,
        note: reason,
      },
    });

    return storeCredit;
  });
}

/**
 * Get customer's store credit
 */
async function getStoreCredit(brandId, customerId) {
  const storeCredit = await prisma.storeCredit.findUnique({
    where: {
      brandId_customerId: {
        brandId,
        customerId,
      },
    },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!storeCredit) {
    return {
      balance: 0,
      currency: null,
      transactions: [],
    };
  }

  // Check expiration
  if (storeCredit.expiresAt && new Date() > storeCredit.expiresAt) {
    // Expire the credit
    await prisma.$transaction(async (tx) => {
      await tx.storeCreditTransaction.create({
        data: {
          storeCreditId: storeCredit.id,
          type: "EXPIRATION",
          amount: -storeCredit.balance,
          balance: 0,
          note: "Store credit expired",
        },
      });

      await tx.storeCredit.update({
        where: { id: storeCredit.id },
        data: { balance: 0 },
      });
    });

    return {
      balance: 0,
      currency: storeCredit.currency,
      expiresAt: storeCredit.expiresAt,
      expired: true,
      transactions: [],
    };
  }

  return storeCredit;
}

/**
 * Apply store credit to an order
 */
async function applyStoreCredit(brandId, customerId, amount, orderId) {
  return await prisma.$transaction(async (tx) => {
    const storeCredit = await tx.storeCredit.findUnique({
      where: {
        brandId_customerId: {
          brandId,
          customerId,
        },
      },
    });

    if (!storeCredit) {
      throw new Error("No store credit available");
    }

    if (storeCredit.balance < amount) {
      throw new Error(`Insufficient store credit. Available: ${storeCredit.balance}`);
    }

    // Check expiration
    if (storeCredit.expiresAt && new Date() > storeCredit.expiresAt) {
      throw new Error("Store credit has expired");
    }

    // Update balance
    const newBalance = storeCredit.balance - amount;
    const updated = await tx.storeCredit.update({
      where: { id: storeCredit.id },
      data: { balance: newBalance },
    });

    // Create transaction
    await tx.storeCreditTransaction.create({
      data: {
        storeCreditId: storeCredit.id,
        orderId,
        type: "DEBIT",
        amount: -amount,
        balance: newBalance,
        note: `Applied ${amount} to order`,
      },
    });

    return {
      storeCredit: updated,
      appliedAmount: amount,
      remainingBalance: newBalance,
    };
  });
}

module.exports = {
  purchaseGiftCard,
  checkBalance,
  redeemGiftCard,
  getTransactionHistory,
  listGiftCards,
  issueStoreCredit,
  getStoreCredit,
  applyStoreCredit,
};
