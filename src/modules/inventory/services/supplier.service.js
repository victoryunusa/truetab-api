// src/modules/inventory/services/supplier.service.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listSuppliers(brandId, params) {
  const { page, pageSize, search, isActive, orderBy, order } = params;

  const where = {
    brandId,
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contactName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
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

async function getSupplier(brandId, id) {
  const supplier = await prisma.supplier.findFirst({
    where: { id, brandId },
  });
  if (!supplier) throw new Error("Supplier not found");
  return supplier;
}

async function createSupplier(brandId, payload, actorId) {
  const supplier = await prisma.supplier.create({
    data: { brandId, ...payload },
  });

  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      action: "supplier.create",
      entity: "Supplier",
      entityId: supplier.id,
      metadata: supplier,
    },
  });

  return supplier;
}

async function updateSupplier(brandId, id, payload, actorId) {
  const existing = await prisma.supplier.findFirst({
    where: { id, brandId },
  });
  if (!existing) throw new Error("Supplier not found");

  const updated = await prisma.supplier.update({
    where: { id },
    data: payload,
  });

  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      action: "supplier.update",
      entity: "Supplier",
      entityId: id,
      metadata: { before: existing, after: updated },
    },
  });

  return updated;
}

// "Delete" = archive by default (isActive=false). Supports hardDelete with safety.
async function deleteSupplier(
  brandId,
  id,
  actorId,
  { hardDelete = false } = {}
) {
  const existing = await prisma.supplier.findFirst({
    where: { id, brandId },
    include: { purchaseOrders: { select: { id: true, status: true } } },
  });
  if (!existing) throw new Error("Supplier not found");

  if (!hardDelete) {
    const updated = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId || null,
        action: "supplier.archive",
        entity: "Supplier",
        entityId: id,
        metadata: { before: existing, after: updated },
      },
    });
    return updated;
  }

  // Safety: block hard delete if there are any POs not CANCELLED
  const hasActivePO = existing.purchaseOrders.some(
    (po) => po.status !== "CANCELLED"
  );
  if (hasActivePO) {
    throw new Error(
      "Cannot hard delete supplier with non-cancelled purchase orders"
    );
  }

  await prisma.$transaction([
    prisma.purchaseOrder.deleteMany({ where: { supplierId: id } }),
    prisma.supplier.delete({ where: { id } }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: actorId || null,
      action: "supplier.delete",
      entity: "Supplier",
      entityId: id,
      metadata: { id },
    },
  });

  return { id, deleted: true };
}

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
