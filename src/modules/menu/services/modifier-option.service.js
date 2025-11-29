const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function buildScope(brandId, branchId) {
  const where = { brandId };
  if (branchId) {
    where.branchId = branchId;
  }
  return where;
}

async function list(groupId, { brandId, branchId }) {
  const group = await prisma.modifierGroup.findFirst({
    where: { id: groupId, ...buildScope(brandId, branchId) },
  });
  if (!group) throw new Error("Modifier group not found");
  return prisma.modifierOption.findMany({
    where: { groupId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

async function create(groupId, { brandId, branchId, name, price, isActive, sortOrder }) {
  const group = await prisma.modifierGroup.findFirst({
    where: { id: groupId, ...buildScope(brandId, branchId) },
  });
  if (!group) throw new Error("Modifier group not found");
  return prisma.modifierOption.create({
    data: { groupId, name, price, isActive, sortOrder },
  });
}

async function update(id, { brandId, branchId, ...data }) {
  const option = await prisma.modifierOption.findFirst({
    where: { id, group: buildScope(brandId, branchId) },
  });
  if (!option) throw new Error("Modifier option not found");
  return prisma.modifierOption.update({ where: { id }, data });
}

async function remove(id, { brandId, branchId }) {
  const option = await prisma.modifierOption.findFirst({
    where: { id, group: buildScope(brandId, branchId) },
  });
  if (!option) throw new Error("Modifier option not found");
  await prisma.modifierOption.delete({ where: { id } });
}

module.exports = { list, create, update, remove };
