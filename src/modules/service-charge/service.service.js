const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getForBranch(branchId) {
  return prisma.serviceCharge.findUnique({ where: { branchId } });
}

async function upsertForBranch(branchId, { percentage, type, isActive }) {
  return prisma.serviceCharge.upsert({
    where: { branchId },
    update: { percentage, type, isActive },
    create: { branchId, percentage, type, isActive },
  });
}

module.exports = { getForBranch, upsertForBranch };
