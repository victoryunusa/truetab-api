const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createAdjustment(
  brandId,
  { productId, quantity, reason, userId }
) {
  return prisma.$transaction(async (tx) => {
    // Ensure product exists
    const product = await tx.product.findFirst({
      where: { id: productId, brandId },
    });
    if (!product) throw new Error("Product not found");

    // Update stock
    let stock = await tx.stockItem.findFirst({ where: { productId } });
    if (!stock) {
      if (quantity < 0) throw new Error("Cannot reduce non-existing stock");
      stock = await tx.stockItem.create({
        data: { productId, quantity },
      });
    } else {
      const newQty = stock.quantity + quantity;
      if (newQty < 0) throw new Error("Stock cannot go negative");
      stock = await tx.stockItem.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });
    }

    // Log adjustment
    const adjustment = await tx.stockAdjustment.create({
      data: { brandId, productId, quantity, reason, userId },
    });

    // Also log in stockTransactions for unified history
    await tx.stockTransaction.create({
      data: {
        brandId,
        productId,
        type: "ADJUSTMENT",
        quantity,
        reference: `ADJ#${adjustment.id}`,
        userId,
      },
    });

    return { adjustment, stock };
  });
}

async function listAdjustments(brandId) {
  return prisma.stockAdjustment.findMany({
    where: { brandId },
    include: { product: true, user: true },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { createAdjustment, listAdjustments };
