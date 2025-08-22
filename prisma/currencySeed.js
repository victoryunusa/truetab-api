const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const countries = [
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "GH", name: "Ghana", currency: "GHS" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  // ...
];

async function main() {
  for (const c of countries) {
    await prisma.country.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
