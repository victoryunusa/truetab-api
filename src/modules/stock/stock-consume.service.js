// src/modules/stock/stock-consume.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Decimal } = require("@prisma/client/runtime/library");
function d(n) {
  return new Decimal(n || 0);
}

async function consumeForOrderTx(tx, orderId, { brandId, branchId, ref }) {
  // if already deducted, do nothing
  const existing = await tx.stockTransaction.findFirst({
    where: { reference: ref },
  });
  if (existing) return;

  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { isVoided: false },
        include: { item: true, variant: true },
      },
    },
  });
  if (!order) return;

  // Map item/variant -> recipe lines
  // Prefer variant recipe if exists else item recipe
  const consumptions = new Map(); // productId => Decimal qty

  for (const line of order.items) {
    const recipe = await tx.recipe.findFirst({
      where: {
        brandId: brandId,
        OR: [
          { variantId: line.variantId || "" },
          { itemId: line.itemId, variantId: null },
        ],
        isActive: true,
      },
      orderBy: [{ variantId: "desc" }], // prefer variant-level
      include: { lines: true },
    });

    if (!recipe) continue;

    for (const rline of recipe.lines) {
      // effective qty = line.quantity * recipe.quantity * (1 + wastePct/100)
      const wasteFactor = rline.wastePct
        ? d(1).plus(d(rline.wastePct).div(100))
        : d(1);
      const qty = d(line.quantity).mul(d(rline.quantity)).mul(wasteFactor);
      const key = rline.productId;
      consumptions.set(key, (consumptions.get(key) || d(0)).add(qty));
    }
  }

  // Persist StockTransaction + mutate StockItem
  for (const [productId, qty] of consumptions.entries()) {
    await tx.stockTransaction.create({
      data: {
        brandId,
        productId,
        type: "SALE",
        quantity: qty.neg(), // stock leaving
        unitCost: null,
        reference: ref,
        notes: `Auto consume on order ${orderId}`,
        userId: order.createdById,
      },
    });

    // reduce stock item (single pool)
    const current = await tx.stockItem.findFirst({ where: { productId } });
    if (!current) {
      await tx.stockItem.create({ data: { productId, quantity: qty.neg() } });
    } else {
      await tx.stockItem.update({
        where: { id: current.id },
        data: { quantity: d(current.quantity).sub(qty) },
      });
    }
  }
}

module.exports = { consumeForOrderTx };
