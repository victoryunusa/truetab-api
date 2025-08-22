const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listTransactions(brandId, params) {
  const { page, pageSize, productId, type } = params;

  const where = {
    brandId,
    ...(productId ? { productId } : {}),
    ...(type ? { type } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.stockTransaction.count({ where }),
    prisma.stockTransaction.findMany({
      where,
      include: { product: true, user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

async function createTransaction(brandId, payload, actorId) {
  const { productId, type, quantity, unitCost, reference, notes } = payload;

  const product = await prisma.product.findFirst({
    where: { id: productId, brandId },
  });
  if (!product) throw new Error("Product not found");

  const tx = await prisma.$transaction(async (tx) => {
    // Create stock transaction
    const stockTx = await tx.stockTransaction.create({
      data: {
        brandId,
        productId,
        type,
        quantity,
        unitCost,
        reference,
        notes,
        userId: actorId || null,
      },
    });

    // Update stock level (positive for PURCHASE/RETURN, negative for SALE/WASTAGE)
    let stockChange = quantity;
    if (["SALE", "WASTAGE", "TRANSFER", "ADJUSTMENT"].includes(type)) {
      stockChange = -Math.abs(quantity);
    }

    // Find or create stock record
    let stockItem = await tx.stockItem.findFirst({
      where: { productId },
    });

    if (!stockItem) {
      stockItem = await tx.stockItem.create({
        data: { productId, quantity: stockChange },
      });
    } else {
      stockItem = await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: stockItem.quantity + stockChange },
      });
    }

    return { stockTx, stockItem };
  });

  return tx;
}

module.exports = {
  listTransactions,
  createTransaction,
};
