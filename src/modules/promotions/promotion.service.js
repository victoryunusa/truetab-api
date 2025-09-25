// src/modules/promotions/promotion.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { Decimal } = require('@prisma/client/runtime/library');
const d = n => new Decimal(n || 0);

// CRUD Operations
async function createPromotion(brandId, data) {
  const promotion = await prisma.promotion.create({
    data: {
      ...data,
      brandId,
    },
  });
  return promotion;
}

async function listPromotions(brandId, { page = 1, limit = 10, status } = {}) {
  const where = { brandId };
  if (status) {
    where.isActive = status === 'active';
  }

  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    }),
    prisma.promotion.count({ where }),
  ]);

  return {
    promotions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getPromotionById(id, brandId) {
  return prisma.promotion.findFirst({
    where: { id, brandId },
    include: {
      _count: {
        select: { redemptions: true },
      },
    },
  });
}

async function updatePromotion(id, brandId, data) {
  const promotion = await prisma.promotion.findFirst({
    where: { id, brandId },
  });
  
  if (!promotion) {
    throw new Error('Promotion not found');
  }

  return prisma.promotion.update({
    where: { id },
    data,
  });
}

async function deletePromotion(id, brandId) {
  const promotion = await prisma.promotion.findFirst({
    where: { id, brandId },
  });
  
  if (!promotion) {
    throw new Error('Promotion not found');
  }

  return prisma.promotion.delete({
    where: { id },
  });
}

async function togglePromotionStatus(id, brandId) {
  const promotion = await prisma.promotion.findFirst({
    where: { id, brandId },
  });
  
  if (!promotion) {
    throw new Error('Promotion not found');
  }

  return prisma.promotion.update({
    where: { id },
    data: { isActive: !promotion.isActive },
  });
}

async function validateAndCompute(tx, orderId, code, { brandId }) {
  const promo = await tx.promotion.findFirst({
    where: {
      brandId,
      code,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
      AND: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
  });
  if (!promo) throw new Error('Invalid or inactive promo code');

  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: { where: { isVoided: false } } },
  });
  if (!order) throw new Error('Order not found');

  const subtotal = order.items.reduce((s, l) => s.plus(d(l.linePrice)), d(0));
  if (promo.minSubtotal && subtotal.lt(d(promo.minSubtotal))) {
    throw new Error('Order does not meet minimum subtotal for this promo');
  }

  if (promo.maxRedemptions && promo.timesRedeemed >= promo.maxRedemptions) {
    throw new Error('This promo has reached its redemption limit');
  }

  // compute discount amount (before service/tax)
  const discount =
    promo.type === 'PERCENT'
      ? subtotal.mul(d(promo.value)).div(100).toDecimalPlaces(2)
      : d(promo.value).toDecimalPlaces(2);

  // upsert redemption and update promo counter
  await tx.promoRedemption.upsert({
    where: { promotionId_orderId: { promotionId: promo.id, orderId } },
    create: { promotionId: promo.id, orderId, amount: discount },
    update: { amount: discount },
  });

  await tx.promotion.update({
    where: { id: promo.id },
    data: { timesRedeemed: { increment: 1 } },
  });

  // store discount on Order (totals engine will use order.discount)
  await tx.order.update({ where: { id: orderId }, data: { discount } });
}

async function remove(tx, orderId) {
  // remove redemption and reset order.discount
  const red = await tx.promoRedemption.findFirst({ where: { orderId } });
  if (red) {
    await tx.promoRedemption.delete({ where: { id: red.id } });
  }
  await tx.order.update({ where: { id: orderId }, data: { discount: 0 } });
}

module.exports = { 
  validateAndCompute, 
  remove, 
  createPromotion,
  listPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
};
