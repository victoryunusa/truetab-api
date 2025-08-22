const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function brandScope(brandId) {
  return { brandId };
}

async function list({ brandId }) {
  return prisma.menuCategory.findMany({
    where: brandScope(brandId),
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

async function create({ brandId, name, parentId, sortOrder, isActive }) {
  if (parentId) {
    const parent = await prisma.menuCategory.findFirst({
      where: { id: parentId, brandId },
    });
    if (!parent) throw new Error("Parent category not found in brand");
  }
  return prisma.menuCategory.create({
    data: { brandId, name, parentId: parentId || null, sortOrder, isActive },
  });
}

async function update(id, { brandId, ...data }) {
  const existing = await prisma.menuCategory.findFirst({
    where: { id, brandId },
  });
  if (!existing) throw new Error("Category not found");
  return prisma.menuCategory.update({ where: { id }, data });
}

async function remove(id, { brandId }) {
  const existing = await prisma.menuCategory.findFirst({
    where: { id, brandId },
  });
  if (!existing) throw new Error("Category not found");
  // delete pivots
  await prisma.itemCategory.deleteMany({ where: { categoryId: id } });
  await prisma.menuCategory.delete({ where: { id } });
}

module.exports = { list, create, update, remove };
