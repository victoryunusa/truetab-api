const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createTransfer(
  brandId,
  { fromBranchId, toBranchId, items, userId }
) {
  return prisma.$transaction(async (tx) => {
    // Create transfer
    const transfer = await tx.stockTransfer.create({
      data: {
        brandId,
        fromBranchId,
        toBranchId,
        createdById: userId,
        status: "PENDING",
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return transfer;
  });
}

async function completeTransfer(transferId, brandId, userId) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findFirst({
      where: { id: transferId, brandId },
      include: { items: true },
    });
    if (!transfer) throw new Error("Transfer not found");
    if (transfer.status !== "PENDING")
      throw new Error("Transfer already processed");

    // Deduct from source branch
    for (const item of transfer.items) {
      let stock = await tx.stockItem.findFirst({
        where: { productId: item.productId, branchId: transfer.fromBranchId },
      });
      if (!stock || stock.quantity < item.quantity) {
        throw new Error(`Not enough stock for product ${item.productId}`);
      }
      await tx.stockItem.update({
        where: { id: stock.id },
        data: { quantity: stock.quantity - item.quantity },
      });
    }

    // Add to destination branch
    for (const item of transfer.items) {
      let stock = await tx.stockItem.findFirst({
        where: { productId: item.productId, branchId: transfer.toBranchId },
      });
      if (!stock) {
        await tx.stockItem.create({
          data: {
            branchId: transfer.toBranchId,
            productId: item.productId,
            quantity: item.quantity,
          },
        });
      } else {
        await tx.stockItem.update({
          where: { id: stock.id },
          data: { quantity: stock.quantity + item.quantity },
        });
      }
    }

    // Mark transfer completed
    return tx.stockTransfer.update({
      where: { id: transfer.id },
      data: { status: "COMPLETED" },
    });
  });
}

async function listTransfers(brandId) {
  return prisma.stockTransfer.findMany({
    where: { brandId },
    include: {
      items: { include: { product: true } },
      fromBranch: true,
      toBranch: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { createTransfer, completeTransfer, listTransfers };
