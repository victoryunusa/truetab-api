const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list({ brandId, branchId }) {
  return prisma.register.findMany({
    where: { branchId },
    orderBy: { name: "asc" },
  });
}

async function create({ brandId, branchId, name, isActive = true }) {
  await assertBranchInBrand(branchId, brandId);
  return prisma.register.create({
    data: { name, isActive, branchId },
  });
}

async function update(id, { branchId, brandId, ...data }) {
  const reg = await prisma.register.findFirst({ where: { id, branchId } });
  if (!reg) throw new Error("Register not found in this branch");
  return prisma.register.update({ where: { id }, data });
}

async function assertBranchInBrand(branchId, brandId) {
  const b = await prisma.branch.findFirst({ where: { id: branchId, brandId } });
  if (!b) throw new Error("Branch not found for this brand");
}

module.exports = { list, create, update };
