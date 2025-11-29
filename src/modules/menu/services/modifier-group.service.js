const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function buildScope(brandId, branchId) {
  const where = { brandId };
  if (branchId) {
    where.branchId = branchId;
  }
  return where;
}

async function assertBranchInBrand(branchId, brandId) {
  if (!branchId) return;
  const b = await prisma.branch.findFirst({ where: { id: branchId, brandId } });
  if (!b) throw new Error("Branch not found for this brand");
}

async function list({ brandId, branchId }) {
  return prisma.modifierGroup.findMany({
    where: buildScope(brandId, branchId),
    orderBy: { name: "asc" },
    include: { options: true },
  });
}

async function create({
  brandId,
  branchId,
  name,
  minSelect = 0,
  maxSelect = 1,
  required = false,
  isActive = true,
}) {
  await assertBranchInBrand(branchId, brandId);
  return prisma.modifierGroup.create({
    data: { 
      brandId, 
      branchId: branchId || null, 
      name, 
      minSelect, 
      maxSelect, 
      required, 
      isActive 
    },
  });
}

async function update(id, { brandId, branchId, ...data }) {
  const existing = await prisma.modifierGroup.findFirst({
    where: { id, ...buildScope(brandId, branchId) },
  });
  if (!existing) throw new Error("Modifier group not found");
  return prisma.modifierGroup.update({
    where: { id },
    data,
    include: { options: true },
  });
}

async function remove(id, { brandId, branchId }) {
  const existing = await prisma.modifierGroup.findFirst({
    where: { id, ...buildScope(brandId, branchId) },
  });
  if (!existing) throw new Error("Modifier group not found");

  await prisma.$transaction([
    prisma.itemModifierGroup.deleteMany({ where: { groupId: id } }),
    prisma.itemVariantModifierGroup.deleteMany({ where: { groupId: id } }),
    prisma.modifierOption.deleteMany({ where: { groupId: id } }),
    prisma.modifierGroup.delete({ where: { id } }),
  ]);
}

module.exports = { list, create, update, remove };
