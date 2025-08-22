const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function listCountries() {
  return prisma.country.findMany({
    orderBy: { name: "asc" },
  });
}

module.exports = { listCountries };
