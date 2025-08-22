// src/modules/orders/payment.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const kds = require("../../realtime/kds");
const waiterBus = require("../../realtime/waiter");
const stock = require("../stock/stock-consume.service");

function refForOrder(orderId) {
  return `ORDER:${orderId}`;
}

async function takePayment(orderId, { brandId, branchId, userId, body }) {
  // body: { method, amount, tipAmount?, reference?, metadata?, sessionId? }
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirstOrThrow({
      where: { id: orderId, brandId, branchId },
    });
    const payment = await tx.payment.create({
      data: {
        brandId,
        branchId,
        orderId,
        sessionId: body.sessionId || null,
        method: body.method,
        amount: body.amount,
        tipAmount: body.tipAmount || 0,
        reference: body.reference || null,
        metadata: body.metadata || {},
      },
    });

    const sum = await tx.payment.aggregate({
      where: { orderId },
      _sum: { amount: true, tipAmount: true },
    });

    const paidTotal =
      Number(sum._sum.amount || 0) + Number(sum._sum.tipAmount || 0);
    const closed = paidTotal >= Number(order.total);

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        paidTotal,
        tip: (Number(order.tip) || 0) + Number(body.tipAmount || 0),
        status: closed ? "PAID" : order.status,
        closedAt: closed ? new Date() : order.closedAt,
      },
      include: {
        payments: true,
        items: { include: { modifiers: true } },
        taxes: true,
      },
    });

    // Ensure stock deduction when fully paid (idempotent)
    if (closed) {
      await stock.consumeForOrderTx(tx, orderId, {
        brandId,
        branchId,
        ref: refForOrder(orderId),
      });
      kds.emitOrderPaid(updated);
    }
    waiterBus.emitOrderUpdated(updated);

    return { order: updated, payment };
  });
}

async function refund(paymentId, { brandId, branchId, userId, body }) {
  // body: { amount, reason? }
  return prisma.$transaction(async (tx) => {
    const pmt = await tx.payment.findFirstOrThrow({
      where: { id: paymentId, brandId, branchId },
    });
    const refund = await tx.paymentRefund.create({
      data: { paymentId, amount: body.amount, reason: body.reason || null },
    });

    const order = await tx.order.findUnique({ where: { id: pmt.orderId } });
    const paidSum = await tx.payment.aggregate({
      where: { orderId: pmt.orderId },
      _sum: { amount: true, tipAmount: true },
    });
    const refundSum = await tx.paymentRefund.aggregate({
      where: { paymentId: paymentId },
      _sum: { amount: true },
    });
    const netPaid =
      Number(paidSum._sum.amount || 0) +
      Number(paidSum._sum.tipAmount || 0) -
      Number(refundSum._sum.amount || 0);

    const updated = await tx.order.update({
      where: { id: pmt.orderId },
      data: {
        paidTotal: netPaid,
        status:
          netPaid >= Number(order.total)
            ? "PAID"
            : netPaid > 0
              ? "PART_PAID"
              : "OPEN",
      },
      include: { payments: true },
    });

    waiterBus.emitOrderUpdated(updated);
    return { order: updated, refund };
  });
}

module.exports = { takePayment, refund };
