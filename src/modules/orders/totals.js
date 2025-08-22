// src/modules/orders/totals.js
// NOTE: all numbers kept in Decimal via Prisma; coerce with Number only for arithmetic if needed
const { Decimal } = require("@prisma/client/runtime/library");

function d(n) {
  return new Decimal(n || 0);
}

async function compute(tx, order) {
  const lines = order.items.filter((i) => !i.isVoided);
  const subtotal = lines.reduce((sum, l) => sum.plus(d(l.linePrice)), d(0));

  // promotions (optional): store computed discount in a side table or on order as discount
  let promoDiscount = d(order.discount || 0);
  // if promo module persists the final discount to order already, leave as is.

  // service charge: pick branch override if exists else brand
  const svcCfg = await tx.serviceChargeConfig.findFirst({
    where: {
      brandId: order.brandId,
      OR: [{ branchId: order.branchId }, { branchId: null }],
      isActive: true,
    },
    orderBy: { branchId: "desc" }, // prefer branch-level
  });

  let service = d(0);
  if (svcCfg) {
    const base = subtotal.minus(promoDiscount).max(0);
    service =
      svcCfg.type === "PERCENT"
        ? base.mul(d(svcCfg.value)).div(100)
        : d(svcCfg.value || 0);
  }

  // taxes: gather active rates (brand/branch scope)
  const taxRates = await tx.taxRate.findMany({
    where: {
      brandId: order.brandId,
      OR: [{ scope: "BRAND" }, { scope: "BRANCH", branchId: order.branchId }],
      isActive: true,
    },
  });

  const taxBase = subtotal.minus(promoDiscount).plus(service).max(0);
  let tax = d(0);

  // Replace existing order_taxes and recalc
  await tx.orderTax.deleteMany({ where: { orderId: order.id } });
  for (const r of taxRates) {
    const amt = taxBase.mul(d(r.ratePct)).div(100);
    tax = tax.plus(amt);
    await tx.orderTax.create({
      data: {
        orderId: order.id,
        taxRateId: r.id,
        name: r.name,
        ratePct: r.ratePct,
        amount: amt,
      },
    });
  }

  // tip is user-entered; keep existing on order.tip
  const tip = d(order.tip || 0);

  const total = taxBase.plus(tax).plus(tip);

  return {
    subtotal,
    discount: promoDiscount,
    service,
    tax,
    tip,
    total,
  };
}

module.exports = { compute };
