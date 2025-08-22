const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const stockService = require("./stock.service");

async function createPO(brandId, supplierId, items, actorId) {
  return prisma.purchaseOrder.create({
    data: {
      brandId,
      supplierId,
      createdBy: actorId,
      status: "DRAFT",
      totalAmount: items.reduce((acc, i) => acc + i.quantity * i.unitCost, 0),
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      },
    },
    include: { items: true, supplier: true },
  });
}

async function listPOs(brandId) {
  return prisma.purchaseOrder.findMany({
    where: { brandId },
    include: { items: { include: { product: true } }, supplier: true },
    orderBy: { createdAt: "desc" },
  });
}

async function receivePO(brandId, poId, receivedItems, actorId) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findFirst({
      where: { id: poId, brandId },
      include: { items: true },
    });
    if (!po) throw new Error("Purchase order not found");

    let fullyReceived = true;

    for (const r of receivedItems) {
      const item = po.items.find((i) => i.id === r.itemId);
      if (!item) throw new Error(`PO item ${r.itemId} not found`);

      const newReceived = item.receivedQty + r.receivedQty;
      if (newReceived < item.quantity) fullyReceived = false;
      if (newReceived > item.quantity) {
        throw new Error(
          `Received quantity exceeds ordered for item ${item.id}`
        );
      }

      // Update received quantity
      await tx.purchaseOrderItem.update({
        where: { id: r.itemId },
        data: { receivedQty: newReceived },
      });

      // Log stock transaction
      await tx.stockTransaction.create({
        data: {
          brandId,
          productId: item.productId,
          type: "PURCHASE",
          quantity: r.receivedQty,
          unitCost: item.unitCost,
          reference: `PO#${po.id}`,
          userId: actorId || null,
        },
      });

      // Update stock levels
      let stockItem = await tx.stockItem.findFirst({
        where: { productId: item.productId },
      });

      if (!stockItem) {
        await tx.stockItem.create({
          data: { productId: item.productId, quantity: r.receivedQty },
        });
      } else {
        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: stockItem.quantity + r.receivedQty },
        });
      }
    }

    // Determine PO status
    const newStatus = fullyReceived ? "RECEIVED" : "PARTIAL";

    const updatedPO = await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus },
      include: { items: true, supplier: true },
    });

    return updatedPO;
  });
}

// async function receivePO(brandId, poId, receivedItems, actorId) {
//   return prisma.$transaction(async (tx) => {
//     const po = await tx.purchaseOrder.findFirst({
//       where: { id: poId, brandId },
//       include: { items: true },
//     });
//     if (!po) throw new Error("Purchase order not found");

//     for (const r of receivedItems) {
//       const item = po.items.find((i) => i.id === r.itemId);
//       if (!item) throw new Error(`PO item ${r.itemId} not found`);

//       // Update received quantity
//       await tx.purchaseOrderItem.update({
//         where: { id: r.itemId },
//         data: { receivedQty: { increment: r.receivedQty } },
//       });

//       // Log stock transaction
//       await tx.stockTransaction.create({
//         data: {
//           brandId,
//           productId: item.productId,
//           type: "PURCHASE",
//           quantity: r.receivedQty,
//           unitCost: item.unitCost,
//           reference: `PO#${po.id}`,
//           userId: actorId || null,
//         },
//       });

//       // Update stock levels
//       let stockItem = await tx.stockItem.findFirst({
//         where: { productId: item.productId },
//       });

//       if (!stockItem) {
//         await tx.stockItem.create({
//           data: { productId: item.productId, quantity: r.receivedQty },
//         });
//       } else {
//         await tx.stockItem.update({
//           where: { id: stockItem.id },
//           data: { quantity: stockItem.quantity + r.receivedQty },
//         });
//       }
//     }

//     // Update PO status
//     const updatedPO = await tx.purchaseOrder.update({
//       where: { id: poId },
//       data: {
//         status: "RECEIVED",
//       },
//       include: { items: true, supplier: true },
//     });

//     return updatedPO;
//   });
// }

module.exports = {
  createPO,
  listPOs,
  receivePO,
};
