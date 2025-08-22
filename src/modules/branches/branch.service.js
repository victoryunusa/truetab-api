const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createBranch({ brandId, name, location, countryId }) {
  if (!brandId) throw new Error("brandId is required");

  const country = await prisma.country.findUnique({
    where: { id: countryId },
  });
  if (!country) throw new Error("Invalid countryId");

  return prisma.branch.create({
    data: {
      brandId,
      name,
      location: location || null,
      countryId: countryId,
      currency: country.currency,
    },
  });
}

async function listBranches({ brandId }) {
  return prisma.branch.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { createBranch, listBranches };
