const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list({ brandId, branchId }) {
  return prisma.tip.findMany({
    where: { brandId, branchId },
    orderBy: { createdAt: "desc" },
    include: { staff: true, order: true },
  });
}

async function create({ brandId, branchId, ...data }) {
  return prisma.tip.create({
    data: { brandId, branchId, ...data },
  });
}

async function summary({ brandId, branchId }) {
  return prisma.tip.groupBy({
    by: ["method", "type"],
    where: { brandId, branchId },
    _sum: { amount: true },
    _count: { _all: true },
  });
}

module.exports = { list, create, summary };
