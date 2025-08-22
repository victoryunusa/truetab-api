const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list({ brandId }) {
  return prisma.tax.findMany({
    where: { brandId },
    orderBy: { name: "asc" },
  });
}

async function create({ brandId, name, rate, type, isActive }) {
  return prisma.tax.create({
    data: { brandId, name, rate, type, isActive },
  });
}

async function update(id, { brandId, ...data }) {
  const existing = await prisma.tax.findFirst({ where: { id, brandId } });
  if (!existing) throw new Error("Tax not found");
  return prisma.tax.update({ where: { id }, data });
}

async function remove(id, { brandId }) {
  const existing = await prisma.tax.findFirst({ where: { id, brandId } });
  if (!existing) throw new Error("Tax not found");
  await prisma.tax.delete({ where: { id } });
}

module.exports = { list, create, update, remove };
