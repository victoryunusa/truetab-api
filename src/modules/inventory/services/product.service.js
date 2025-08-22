const { prisma } = require("../../../lib/prisma");

async function listProducts(brandId, params) {
  const { page, pageSize, search, categoryId, isActive, orderBy, order } =
    params;

  const where = {
    brandId,
    ...(categoryId ? { categoryId } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true, stockItems: true },
      orderBy: { [orderBy]: order },
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

async function getProduct(brandId, id) {
  const product = await prisma.product.findFirst({
    where: { id, brandId },
    include: { category: true, stockItems: true },
  });
  if (!product) throw new Error("Product not found");
  return product;
}

async function createProduct(brandId, payload, actorId) {
  const product = await prisma.product.create({
    data: { brandId, ...payload },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      metadata: product,
    },
  });

  return product;
}

async function updateProduct(brandId, id, payload, actorId) {
  const existing = await prisma.product.findFirst({
    where: { id, brandId },
  });
  if (!existing) throw new Error("Product not found");

  const updated = await prisma.product.update({
    where: { id },
    data: payload,
  });

  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      action: "product.update",
      entity: "Product",
      entityId: id,
      metadata: { before: existing, after: updated },
    },
  });

  return updated;
}

async function deleteProduct(brandId, id, actorId) {
  const existing = await prisma.product.findFirst({ where: { id, brandId } });
  if (!existing) throw new Error("Product not found");

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      action: "product.archive",
      entity: "Product",
      entityId: id,
      metadata: { before: existing, after: updated },
    },
  });

  return updated;
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
