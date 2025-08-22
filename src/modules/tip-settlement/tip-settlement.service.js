const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function settle({ brandId, branchId, registerId, rule }) {
  // 1. Fetch all pooled tips for the branch not yet settled
  const pooledTips = await prisma.tip.findMany({
    where: {
      brandId,
      branchId,
      type: "POOLED",
      orderId: { not: null }, // only tips tied to orders
    },
  });

  const total = pooledTips.reduce((sum, t) => sum + Number(t.amount), 0);
  if (total === 0) throw new Error("No pooled tips to settle");

  // 2. Find eligible staff (for simplicity, all staff who had orders with tips)
  const staffIds = [
    ...new Set(pooledTips.filter((t) => t.staffId).map((t) => t.staffId)),
  ];

  if (staffIds.length === 0)
    throw new Error("No staff eligible for settlement");

  // 3. Allocate tips
  let allocations = [];
  if (rule === "EQUAL") {
    const share = total / staffIds.length;
    allocations = staffIds.map((id) => ({ staffId: id, amount: share }));
  } else if (rule === "HOURS") {
    // Future: use shift hours
    throw new Error("HOURS-based allocation not yet implemented");
  } else if (rule === "SALES") {
    // Future: use staff sales volume
    throw new Error("SALES-based allocation not yet implemented");
  }

  // 4. Create settlement record
  const settlement = await prisma.tipSettlement.create({
    data: {
      brandId,
      branchId,
      registerId,
      rule,
      total,
      allocations: {
        create: allocations.map((a) => ({
          staffId: a.staffId,
          amount: a.amount,
        })),
      },
    },
    include: { allocations: { include: { staff: true } } },
  });

  return settlement;
}

async function list({ brandId, branchId }) {
  return prisma.tipSettlement.findMany({
    where: { brandId, branchId },
    include: { allocations: { include: { staff: true } } },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { settle, list };
