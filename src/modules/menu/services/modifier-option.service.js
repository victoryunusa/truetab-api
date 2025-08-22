const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list(groupId, { brandId }) {
  const group = await prisma.modifierGroup.findFirst({
    where: { id: groupId, brandId },
  });
  if (!group) throw new Error("Modifier group not found");
  return prisma.modifierOption.findMany({
    where: { groupId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

async function create(groupId, { brandId, name, price, isActive, sortOrder }) {
  const group = await prisma.modifierGroup.findFirst({
    where: { id: groupId, brandId },
  });
  if (!group) throw new Error("Modifier group not found");
  return prisma.modifierOption.create({
    data: { groupId, name, price, isActive, sortOrder },
  });
}

async function update(id, { brandId, ...data }) {
  const option = await prisma.modifierOption.findFirst({
    where: { id, group: { brandId } },
  });
  if (!option) throw new Error("Modifier option not found");
  return prisma.modifierOption.update({ where: { id }, data });
}

async function remove(id, { brandId }) {
  const option = await prisma.modifierOption.findFirst({
    where: { id, group: { brandId } },
  });
  if (!option) throw new Error("Modifier option not found");
  await prisma.modifierOption.delete({ where: { id } });
}

module.exports = { list, create, update, remove };
