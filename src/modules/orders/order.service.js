// src/modules/orders/order.service.js
const { PrismaClient, OrderStatus } = require("@prisma/client");
const prisma = new PrismaClient();
const totals = require("./totals");
const kds = require("../../realtime/kds"); // socket emitter (emit to rooms)
const waiterBus = require("../../realtime/waiter"); // socket emitter
const stock = require("../stock/stock-consume.service");
const promoSvc = require("../promotions/promotion.service"); // optional; no-op if unavailable

function refForOrder(orderId) {
  return `ORDER:${orderId}`;
}

async function list({ brandId, branchId, query }) {
  const where = { brandId, branchId };
  if (query?.status) where.status = query.status;
  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { modifiers: true, item: true, variant: true } },
      payments: true,
      taxes: true,
      logs: true,
    },
  });
}

async function get(id, { brandId, branchId }) {
  return prisma.order.findFirstOrThrow({
    where: { id, brandId, branchId },
    include: {
      items: {
        include: { modifiers: true, item: true, variant: true, tickets: true },
      },
      payments: true,
      taxes: true,
      logs: true,
    },
  });
}

async function create({ brandId, branchId, userId, payload }) {
  // payload: { type, tableId?, customerId?, waiterId?, covers?, notes?, items[], discountCode? }
  return prisma.$transaction(async (tx) => {
    // Basic create with DRAFT
    const order = await tx.order.create({
      data: {
        brandId,
        branchId,
        createdById: userId,
        type: payload.type,
        tableId: payload.tableId || null,
        customerId: payload.customerId || null,
        waiterId: payload.waiterId || null,
        covers: payload.covers || null,
        notes: payload.notes || null,
        status: "DRAFT",
      },
    });

    // Add items
    if (Array.isArray(payload.items) && payload.items.length) {
      await addItemsTx(tx, order, payload.items, { brandId, branchId, userId });
    }

    // Apply promo if provided
    if (payload.discountCode) {
      await safeApplyPromoTx(tx, order.id, payload.discountCode, { brandId });
    }

    // Recalculate totals with current lines
    const updated = await recalcTotalsTx(tx, order.id);

    // Transition to OPEN right away (POS flow)
    const final = await tx.order.update({
      where: { id: order.id },
      data: { status: "OPEN" },
      include: { items: { include: { modifiers: true } }, taxes: true },
    });

    // KDS ticketing for lines (FINE_DINE flows will use station routing)
    await createTicketsForOrder(tx, final);

    // Emit to KDS/waiter
    kds.emitOrderNew(final);
    waiterBus.emitOrderNew(final);

    return final;
  });
}

async function addItems(orderId, items, ctx) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirstOrThrow({
      where: { id: orderId, brandId: ctx.brandId, branchId: ctx.branchId },
    });
    await addItemsTx(tx, order, items, ctx);
    const updated = await recalcTotalsTx(tx, order.id);
    // Update/append tickets for new lines
    await createTicketsForOrder(tx, updated, { onlyNew: true });
    kds.emitOrderUpdated(updated);
    waiterBus.emitOrderUpdated(updated);
    return updated;
  });
}

async function addItemsTx(tx, order, items, { brandId, branchId, userId }) {
  for (const line of items) {
    const oi = await tx.orderItem.create({
      data: {
        orderId: order.id,
        itemId: line.itemId,
        variantId: line.variantId || null,
        quantity: line.quantity,
        basePrice: line.basePrice, // client can pass price or fetch from variant
        linePrice: line.basePrice, // updated below after modifiers
        notes: line.notes || null,
        routeToId: null,
      },
    });

    let modTotal = 0;
    if (Array.isArray(line.modifiers) && line.modifiers.length) {
      for (const m of line.modifiers) {
        await tx.orderItemModifier.create({
          data: {
            orderItemId: oi.id,
            optionId: m.optionId,
            price: m.price || 0,
          },
        });
        modTotal += Number(m.price || 0);
      }
    }

    const linePrice =
      (Number(line.basePrice) + modTotal) * Number(line.quantity);
    await tx.orderItem.update({ where: { id: oi.id }, data: { linePrice } });
  }

  await tx.orderLog.create({
    data: { orderId: order.id, status: "OPEN", message: "Items added", userId },
  });
}

async function update(id, { brandId, branchId, userId, patch }) {
  const order = await prisma.$transaction(async (tx) => {
    // limited updatable fields: tableId, waiterId, covers, notes
    const o = await tx.order.update({
      where: { id },
      data: {
        tableId: patch.tableId ?? undefined,
        waiterId: patch.waiterId ?? undefined,
        covers: patch.covers ?? undefined,
        notes: patch.notes ?? undefined,
      },
      include: { items: { include: { modifiers: true } }, taxes: true },
    });
    await tx.orderLog.create({
      data: { orderId: id, status: o.status, message: "Order updated", userId },
    });
    return o;
  });
  kds.emitOrderUpdated(order);
  waiterBus.emitOrderUpdated(order);
  return order;
}

async function updateItem(orderId, orderItemId, patch, ctx) {
  return prisma.$transaction(async (tx) => {
    // supports quantity, notes, mark voided
    const current = await tx.orderItem.findFirstOrThrow({
      where: { id: orderItemId, orderId },
    });
    const updated = await tx.orderItem.update({
      where: { id: orderItemId },
      data: {
        quantity: patch.quantity ?? undefined,
        notes: patch.notes ?? undefined,
        isVoided: patch.isVoided ?? undefined,
      },
    });
    await recalcTotalsTx(tx, orderId);
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { modifiers: true } } },
    });
    kds.emitOrderUpdated(order);
    waiterBus.emitOrderUpdated(order);
    return order;
  });
}

async function removeItem(orderId, orderItemId, ctx) {
  return prisma.$transaction(async (tx) => {
    await tx.orderItem.delete({ where: { id: orderItemId } });
    const updated = await recalcTotalsTx(tx, orderId);
    kds.emitOrderUpdated(updated);
    waiterBus.emitOrderUpdated(updated);
    return updated;
  });
}

async function updateStatus(id, nextStatus, { brandId, branchId, userId }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirstOrThrow({
      where: { id, brandId, branchId },
    });

    const updated = await tx.order.update({
      where: { id },
      data: {
        status: nextStatus,
        closedAt: nextStatus === OrderStatus.PAID ? new Date() : order.closedAt,
      },
      include: {
        items: { include: { modifiers: true } },
        payments: true,
        taxes: true,
      },
    });

    await tx.orderLog.create({
      data: {
        orderId: id,
        status: nextStatus,
        message: `Status -> ${nextStatus}`,
        userId,
      },
    });

    // KDS signals
    if (nextStatus === "IN_PROGRESS") kds.emitOrderStarted(updated);
    if (nextStatus === "READY") kds.emitOrderReady(updated);
    if (nextStatus === "SERVED") {
      // stock deduction on SERVED (idempotent via reference)
      await stock.consumeForOrderTx(tx, updated.id, {
        brandId,
        branchId,
        ref: refForOrder(id),
      });
      kds.emitOrderServed(updated);
    }
    if (nextStatus === "PAID") {
      // if not yet deducted on SERVED, ensure deduction now
      await stock.consumeForOrderTx(tx, updated.id, {
        brandId,
        branchId,
        ref: refForOrder(id),
      });
      kds.emitOrderPaid(updated);
    }

    waiterBus.emitOrderUpdated(updated);
    return updated;
  });
}

// --- helpers

async function recalcTotalsTx(tx, orderId) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        where: { isVoided: false },
        include: { modifiers: true, item: true, variant: true },
      },
      taxes: true,
    },
  });

  const result = await totals.compute(tx, order);
  return tx.order.update({
    where: { id: orderId },
    data: {
      subtotal: result.subtotal,
      discount: result.discount,
      service: result.service,
      tax: result.tax,
      tip: result.tip,
      total: result.total,
    },
    include: {
      items: { include: { modifiers: true } },
      taxes: true,
    },
  });
}

async function createTicketsForOrder(tx, order, opts = {}) {
  // Routes: VariantRoute > ItemRoute > (fallback: no route => no ticket)
  const newItems = opts.onlyNew
    ? order.items.filter((i) => !i.tickets?.length)
    : order.items;

  for (const line of newItems) {
    // fetch route
    const vr = await tx.variantRoute.findFirst({
      where: { variantId: line.variantId || "" },
    });
    const ir = !vr
      ? await tx.itemRoute.findFirst({ where: { itemId: line.itemId } })
      : null;
    const stationId = vr?.stationId || ir?.stationId;
    if (!stationId) continue;

    const ticket = await tx.kitchenTicket.create({
      data: {
        brandId: order.brandId,
        branchId: order.branchId,
        orderId: order.id,
        stationId,
        status: "NEW",
      },
    });

    await tx.kitchenTicketItem.create({
      data: {
        ticketId: ticket.id,
        orderItemId: line.id,
        status: "NEW",
      },
    });
  }
}

async function safeApplyPromoTx(tx, orderId, code, { brandId }) {
  if (!promoSvc?.validateAndCompute) return; // optional module not mounted
  await promoSvc.validateAndCompute(tx, orderId, code, { brandId });
}

module.exports = {
  create,
  list,
  get,
  update,
  updateStatus,
  addItems,
  updateItem,
  removeItem,
  applyPromo: async (id, code, ctx) =>
    prisma.$transaction((tx) =>
      safeApplyPromoTx(tx, id, code, ctx).then(() => recalcTotalsTx(tx, id))
    ),
  removePromo: async (id, ctx) =>
    prisma.$transaction(async (tx) => {
      if (promoSvc?.remove) await promoSvc.remove(tx, id, ctx);
      return recalcTotalsTx(tx, id);
    }),
};
