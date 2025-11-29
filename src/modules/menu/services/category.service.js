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
  return prisma.menuCategory.findMany({
    where: buildScope(brandId, branchId),
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

async function create({ brandId, branchId, name, parentId, sortOrder, isActive }) {
  await assertBranchInBrand(branchId, brandId);
  
  if (parentId) {
    const parent = await prisma.menuCategory.findFirst({
      where: { id: parentId, ...buildScope(brandId, branchId) },
    });
    if (!parent) throw new Error("Parent category not found in brand/branch");
  }
  return prisma.menuCategory.create({
    data: { 
      brandId, 
      branchId: branchId || null, 
      name, 
      parentId: parentId || null, 
      sortOrder, 
      isActive 
    },
  });
}

async function update(id, { brandId, branchId, ...data }) {
  const existing = await prisma.menuCategory.findFirst({
    where: { id, ...buildScope(brandId, branchId) },
  });
  if (!existing) throw new Error("Category not found");
  return prisma.menuCategory.update({ where: { id }, data });
}

async function remove(id, { brandId, branchId }) {
  const existing = await prisma.menuCategory.findFirst({
    where: { id, ...buildScope(brandId, branchId) },
  });
  if (!existing) throw new Error("Category not found");
  // delete pivots
  await prisma.itemCategory.deleteMany({ where: { categoryId: id } });
  await prisma.menuCategory.delete({ where: { id } });
}

module.exports = { list, create, update, remove };
