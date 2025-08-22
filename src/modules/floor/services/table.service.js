const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

function genCode() {
  // short, URL-safe code for QR
  return crypto.randomBytes(3).toString("hex"); // 6-char code
}

async function list({ branchId }) {
  return prisma.table.findMany({
    where: { branchId },
    orderBy: [{ name: "asc" }],
    include: { zone: true },
  });
}

async function get(id, { branchId }) {
  const table = await prisma.table.findFirst({
    where: { id, branchId },
    include: { zone: true },
  });
  if (!table) throw new Error("Table not found in this branch");
  return table;
}

async function create({ brandId, branchId, name, capacity, zoneId }) {
  await assertBranchInBrand(branchId, brandId);
  if (zoneId) await assertZoneInBranch(zoneId, branchId);

  // unique code retry
  let code;
  for (let i = 0; i < 5; i++) {
    code = genCode();
    const exists = await prisma.table.findUnique({ where: { code } });
    if (!exists) break;
    if (i === 4) throw new Error("Failed to generate unique table code");
  }

  return prisma.table.create({
    data: {
      name,
      capacity,
      zoneId: zoneId || null,
      branchId,
      code,
    },
  });
}

async function update(
  id,
  { branchId, brandId, name, capacity, zoneId, status }
) {
  const tbl = await prisma.table.findFirst({ where: { id, branchId } });
  if (!tbl) throw new Error("Table not found in this branch");

  if (zoneId) await assertZoneInBranch(zoneId, branchId);

  return prisma.table.update({
    where: { id },
    data: { name, capacity, zoneId: zoneId || null, status },
  });
}

async function remove(id, { branchId }) {
  const tbl = await prisma.table.findFirst({ where: { id, branchId } });
  if (!tbl) throw new Error("Table not found in this branch");

  // If you prefer soft delete: return prisma.table.update({ where: { id }, data: { status: "OUT_OF_SERVICE" }});
  return prisma.table.delete({ where: { id } });
}

async function assertBranchInBrand(branchId, brandId) {
  const b = await prisma.branch.findFirst({ where: { id: branchId, brandId } });
  if (!b) throw new Error("Branch not found for this brand");
}
async function assertZoneInBranch(zoneId, branchId) {
  const z = await prisma.zone.findFirst({ where: { id: zoneId, branchId } });
  if (!z) throw new Error("Zone not found in this branch");
}

module.exports = { list, get, create, update, remove };
