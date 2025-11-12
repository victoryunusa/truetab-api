const prisma = require("../../lib/prisma");
const { stripe } = require("../../services/stripe.service");
const { nanoid } = require("nanoid");

/**
 * Get or create wallet for brand/branch
 */
async function getOrCreateWallet(brandId, branchId = null) {
  let wallet = await prisma.restaurantWallet.findFirst({
    where: {
      brandId,
      branchId,
    },
  });

  if (!wallet) {
    // Get brand currency
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { currency: true },
    });

    wallet = await prisma.restaurantWallet.create({
      data: {
        brandId,
        branchId,
        currency: brand.currency || "USD",
        balance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      },
    });
  }

  return wallet;
}

/**
 * Credit wallet (add money from orders)
 */
async function creditWallet({
  brandId,
  branchId = null,
  amount,
  type = "CREDIT",
  description,
  orderId = null,
  reference = null,
  metadata = null,
}) {
  const wallet = await getOrCreateWallet(brandId, branchId);

  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + Number(amount);

  // Create transaction
  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      orderId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      status: "COMPLETED",
      description,
      metadata,
      reference: reference || `txn-${nanoid()}`,
    },
  });

  // Update wallet balance
  await prisma.restaurantWallet.update({
    where: { id: wallet.id },
    data: {
      balance: balanceAfter,
      totalEarned: {
        increment: Number(amount),
      },
    },
  });

  return transaction;
}

/**
 * Debit wallet (for fees, refunds, payouts)
 */
async function debitWallet({
  brandId,
  branchId = null,
  amount,
  type = "DEBIT",
  description,
  orderId = null,
  payoutId = null,
  reference = null,
  metadata = null,
}) {
  const wallet = await getOrCreateWallet(brandId, branchId);

  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore - Number(amount);

  if (balanceAfter < 0) {
    throw new Error("Insufficient balance");
  }

  // Create transaction
  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      orderId,
      payoutId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      status: "COMPLETED",
      description,
      metadata,
      reference: reference || `txn-${nanoid()}`,
    },
  });

  // Update wallet balance
  await prisma.restaurantWallet.update({
    where: { id: wallet.id },
    data: {
      balance: balanceAfter,
      ...(type === "PAYOUT" && {
        totalWithdrawn: {
          increment: Number(amount),
        },
      }),
    },
  });

  return transaction;
}

/**
 * Get wallet balance and summary
 */
async function getWalletSummary(brandId, branchId = null) {
  const wallet = await getOrCreateWallet(brandId, branchId);

  // Get pending payouts
  const pendingPayouts = await prisma.payout.aggregate({
    where: {
      walletId: wallet.id,
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
    _sum: {
      amount: true,
    },
  });

  const availableBalance = Number(wallet.balance) - Number(pendingPayouts._sum.amount || 0);

  return {
    ...wallet,
    availableBalance,
    pendingPayouts: Number(pendingPayouts._sum.amount || 0),
  };
}

/**
 * Get wallet transaction history
 */
async function getTransactionHistory({
  brandId,
  branchId = null,
  type = null,
  limit = 50,
  offset = 0,
}) {
  const wallet = await getOrCreateWallet(brandId, branchId);

  const transactions = await prisma.walletTransaction.findMany({
    where: {
      walletId: wallet.id,
      ...(type && { type }),
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          isOnlineOrder: true,
        },
      },
      payout: {
        select: {
          reference: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });

  return transactions;
}

/**
 * Request payout to bank account
 */
async function requestPayout({
  brandId,
  branchId = null,
  amount,
  bankAccountId = null,
  method = "BANK_TRANSFER",
}) {
  const wallet = await getOrCreateWallet(brandId, branchId);

  // Check balance
  const summary = await getWalletSummary(brandId, branchId);
  if (Number(amount) > summary.availableBalance) {
    throw new Error("Insufficient balance for payout");
  }

  // Check minimum payout amount
  if (Number(amount) < Number(wallet.minPayoutAmount)) {
    throw new Error(`Minimum payout amount is ${wallet.minPayoutAmount}`);
  }

  // Get or validate bank account
  let bankAccount = null;
  if (bankAccountId) {
    bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        walletId: wallet.id,
      },
    });

    if (!bankAccount) {
      throw new Error("Bank account not found");
    }
  } else {
    // Get default bank account
    bankAccount = await prisma.bankAccount.findFirst({
      where: {
        walletId: wallet.id,
        isDefault: true,
      },
    });

    if (!bankAccount) {
      throw new Error("No default bank account found");
    }
  }

  // Create payout record
  const payout = await prisma.payout.create({
    data: {
      walletId: wallet.id,
      bankAccountId: bankAccount.id,
      amount,
      currency: wallet.currency,
      status: "PENDING",
      method,
      reference: `payout-${nanoid()}`,
    },
  });

  return payout;
}

/**
 * Process payout (called by admin or automated system)
 */
async function processPayout(payoutId) {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      wallet: true,
      bankAccount: true,
    },
  });

  if (!payout) {
    throw new Error("Payout not found");
  }

  if (payout.status !== "PENDING") {
    throw new Error("Payout already processed");
  }

  // Update status to processing
  await prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "PROCESSING",
      processedAt: new Date(),
    },
  });

  try {
    // If using Stripe Connect, create payout through Stripe
    if (payout.method === "STRIPE_CONNECT" && payout.wallet.stripeAccountId) {
      const stripePayoutResult = await stripe.transfers.create({
        amount: Math.round(Number(payout.amount) * 100),
        currency: payout.currency.toLowerCase(),
        destination: payout.wallet.stripeAccountId,
        description: `Payout ${payout.reference}`,
        metadata: {
          payoutId: payout.id,
          walletId: payout.walletId,
        },
      });

      // Update payout with Stripe ID
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          stripePayoutId: stripePayoutResult.id,
        },
      });
    }

    // Debit wallet
    await debitWallet({
      brandId: payout.wallet.brandId,
      branchId: payout.wallet.branchId,
      amount: payout.amount,
      type: "PAYOUT",
      description: `Payout to ${payout.bankAccount.bankName} (${payout.bankAccount.accountNumber.slice(-4)})`,
      payoutId: payout.id,
      reference: payout.reference,
    });

    // Mark payout as completed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        bankAccount: true,
      },
    });
  } catch (error) {
    // Mark payout as failed
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureReason: error.message,
      },
    });

    throw error;
  }
}

/**
 * Get payout history
 */
async function getPayouts({ brandId, branchId = null, status = null, limit = 50, offset = 0 }) {
  const wallet = await getOrCreateWallet(brandId, branchId);

  return prisma.payout.findMany({
    where: {
      walletId: wallet.id,
      ...(status && { status }),
    },
    include: {
      bankAccount: {
        select: {
          accountName: true,
          bankName: true,
          accountNumber: true,
        },
      },
    },
    orderBy: {
      requestedAt: "desc",
    },
    take: limit,
    skip: offset,
  });
}

/**
 * Cancel pending payout
 */
async function cancelPayout(payoutId) {
  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error("Payout not found");
  }

  if (payout.status !== "PENDING") {
    throw new Error("Cannot cancel processed payout");
  }

  return prisma.payout.update({
    where: { id: payoutId },
    data: {
      status: "CANCELLED",
      failedAt: new Date(),
      failureReason: "Cancelled by user",
    },
  });
}

module.exports = {
  getOrCreateWallet,
  creditWallet,
  debitWallet,
  getWalletSummary,
  getTransactionHistory,
  requestPayout,
  processPayout,
  getPayouts,
  cancelPayout,
};
