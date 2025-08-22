const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list({ brandId, branchId }) {
  return prisma.zone.findMany({
    where: { branchId },
    orderBy: { name: "asc" },
  });
}

async function create({ brandId, branchId, name, isActive = true }) {
  // ensure branch belongs to brand
  await assertBranchInBrand(branchId, brandId);
  return prisma.zone.create({
    data: { name, isActive, branchId },
  });
}

async function update(id, { brandId, branchId, ...data }) {
  const zone = await prisma.zone.findFirst({ where: { id, branchId } });
  if (!zone) throw new Error("Zone not found in this branch");
  return prisma.zone.update({ where: { id }, data });
}

async function remove(id, { brandId, branchId }) {
  const zone = await prisma.zone.findFirst({ where: { id, branchId } });
  if (!zone) throw new Error("Zone not found in this branch");

  // If you want soft delete: return prisma.zone.update({ where: { id }, data: { isActive: false }});
  return prisma.zone.delete({ where: { id } });
}

async function assertBranchInBrand(branchId, brandId) {
  const b = await prisma.branch.findFirst({ where: { id: branchId, brandId } });
  if (!b) throw new Error("Branch not found for this brand");
}

module.exports = { list, create, update, remove };
