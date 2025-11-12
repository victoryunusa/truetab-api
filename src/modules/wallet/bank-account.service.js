const prisma = require("../../lib/prisma");
const walletService = require("./wallet.service");

/**
 * Add bank account to wallet
 */
async function addBankAccount({
  brandId,
  branchId = null,
  accountName,
  accountNumber,
  bankName,
  bankCode = null,
  routingNumber = null,
  swiftCode = null,
  iban = null,
  currency = "USD",
  isDefault = false,
}) {
  // Get or create wallet
  const wallet = await walletService.getOrCreateWallet(brandId, branchId);

  // If this is set as default, unset other defaults
  if (isDefault) {
    await prisma.bankAccount.updateMany({
      where: {
        walletId: wallet.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }

  // Create bank account
  const bankAccount = await prisma.bankAccount.create({
    data: {
      walletId: wallet.id,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      routingNumber,
      swiftCode,
      iban,
      currency,
      isDefault,
      isVerified: false,
    },
  });

  return bankAccount;
}

/**
 * Get all bank accounts for a wallet
 */
async function getBankAccounts(brandId, branchId = null) {
  const wallet = await walletService.getOrCreateWallet(brandId, branchId);

  return prisma.bankAccount.findMany({
    where: {
      walletId: wallet.id,
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * Get single bank account
 */
async function getBankAccount(bankAccountId) {
  return prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });
}

/**
 * Update bank account
 */
async function updateBankAccount(bankAccountId, updates) {
  const allowedUpdates = [
    "accountName",
    "accountNumber",
    "bankName",
    "bankCode",
    "routingNumber",
    "swiftCode",
    "iban",
  ];

  const filteredUpdates = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  return prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: filteredUpdates,
  });
}

/**
 * Set default bank account
 */
async function setDefaultBankAccount(bankAccountId) {
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw new Error("Bank account not found");
  }

  // Unset other defaults
  await prisma.bankAccount.updateMany({
    where: {
      walletId: bankAccount.walletId,
      isDefault: true,
    },
    data: {
      isDefault: false,
    },
  });

  // Set this as default
  return prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: { isDefault: true },
  });
}

/**
 * Verify bank account (admin function)
 */
async function verifyBankAccount(bankAccountId, isVerified = true) {
  return prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: { isVerified },
  });
}

/**
 * Delete bank account
 */
async function deleteBankAccount(bankAccountId) {
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw new Error("Bank account not found");
  }

  // Check if bank account has pending payouts
  const pendingPayouts = await prisma.payout.count({
    where: {
      bankAccountId,
      status: {
        in: ["PENDING", "PROCESSING"],
      },
    },
  });

  if (pendingPayouts > 0) {
    throw new Error("Cannot delete bank account with pending payouts");
  }

  // If this was the default, set another as default if available
  if (bankAccount.isDefault) {
    const otherAccount = await prisma.bankAccount.findFirst({
      where: {
        walletId: bankAccount.walletId,
        id: { not: bankAccountId },
      },
    });

    if (otherAccount) {
      await prisma.bankAccount.update({
        where: { id: otherAccount.id },
        data: { isDefault: true },
      });
    }
  }

  await prisma.bankAccount.delete({
    where: { id: bankAccountId },
  });

  return { success: true };
}

module.exports = {
  addBankAccount,
  getBankAccounts,
  getBankAccount,
  updateBankAccount,
  setDefaultBankAccount,
  verifyBankAccount,
  deleteBankAccount,
};
