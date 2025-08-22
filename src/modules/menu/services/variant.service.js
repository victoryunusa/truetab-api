const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listForItem(itemId, { brandId }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  return prisma.itemVariant.findMany({
    where: { itemId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

async function createForItem(itemId, { brandId, ...data }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  return prisma.itemVariant.create({ data: { ...data, itemId } });
}

async function update(variantId, { brandId, ...data }) {
  const variant = await prisma.itemVariant.findFirst({
    where: { id: variantId, item: { brandId } },
  });
  if (!variant) throw new Error("Variant not found");
  return prisma.itemVariant.update({ where: { id: variantId }, data });
}

async function remove(variantId, { brandId }) {
  const variant = await prisma.itemVariant.findFirst({
    where: { id: variantId, item: { brandId } },
  });
  if (!variant) throw new Error("Variant not found");
  await prisma.itemVariantModifierGroup.deleteMany({ where: { variantId } });
  await prisma.branchItemVariant.deleteMany({ where: { variantId } });
  await prisma.itemVariant.delete({ where: { id: variantId } });
}

async function listBranchOverrides(variantId, { brandId }) {
  const variant = await prisma.itemVariant.findFirst({
    where: { id: variantId, item: { brandId } },
  });
  if (!variant) throw new Error("Variant not found");
  return prisma.branchItemVariant.findMany({
    where: { variantId },
    include: { branch: true },
  });
}

async function upsertBranchOverride(
  variantId,
  branchId,
  { brandId, price, isAvailable }
) {
  const variant = await prisma.itemVariant.findFirst({
    where: { id: variantId, item: { brandId } },
  });
  if (!variant) throw new Error("Variant not found");
  // ensure branch belongs to same brand
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, brandId },
  });
  if (!branch) throw new Error("Branch not found in brand");

  return prisma.branchItemVariant.upsert({
    where: { branchId_variantId: { branchId, variantId } },
    update: { price: price ?? null, isAvailable },
    create: { branchId, variantId, price: price ?? null, isAvailable },
  });
}

async function deleteBranchOverride(variantId, branchId, { brandId }) {
  const variant = await prisma.itemVariant.findFirst({
    where: { id: variantId, item: { brandId } },
  });
  if (!variant) throw new Error("Variant not found");
  await prisma.branchItemVariant.delete({
    where: { branchId_variantId: { branchId, variantId } },
  });
}

async function linkModifierGroups(variantId, { brandId, groupIds }) {
  const variant = await prisma.itemVariant.findFirst({
    where: { id: variantId, item: { brandId } },
  });
  if (!variant) throw new Error("Variant not found");
  const groups = await prisma.modifierGroup.findMany({
    where: { id: { in: groupIds }, brandId },
  });
  if (groups.length !== groupIds.length)
    throw new Error("Some modifier groups not found in brand");

  await prisma.itemVariantModifierGroup.deleteMany({ where: { variantId } });
  await prisma.itemVariantModifierGroup.createMany({
    data: groupIds.map((gid) => ({ variantId, groupId: gid })),
    skipDuplicates: true,
  });

  return prisma.itemVariantModifierGroup.findMany({
    where: { variantId },
    include: { group: { include: { options: true } } },
  });
}

module.exports = {
  listForItem,
  createForItem,
  update,
  remove,
  listBranchOverrides,
  upsertBranchOverride,
  deleteBranchOverride,
  linkModifierGroups,
};
