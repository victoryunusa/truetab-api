const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list({ brandId }) {
  return prisma.modifierGroup.findMany({
    where: { brandId },
    orderBy: { name: "asc" },
    include: { options: true },
  });
}

async function create({
  brandId,
  name,
  minSelect = 0,
  maxSelect = 1,
  required = false,
  isActive = true,
}) {
  return prisma.modifierGroup.create({
    data: { brandId, name, minSelect, maxSelect, required, isActive },
  });
}

async function update(id, { brandId, ...data }) {
  const existing = await prisma.modifierGroup.findFirst({
    where: { id, brandId },
  });
  if (!existing) throw new Error("Modifier group not found");
  return prisma.modifierGroup.update({
    where: { id },
    data,
    include: { options: true },
  });
}

async function remove(id, { brandId }) {
  const existing = await prisma.modifierGroup.findFirst({
    where: { id, brandId },
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
