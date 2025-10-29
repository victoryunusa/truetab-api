const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Reset all Polar product IDs in subscription plans
 * This allows the system to create fresh products in Polar
 */
async function resetPolarIds() {
  try {
    console.log("Resetting Polar product IDs...");
    
    const result = await prisma.subscriptionPlan.updateMany({
      where: {
        OR: [
          { polarProductIdMonthly: { not: null } },
          { polarProductIdYearly: { not: null } },
        ],
      },
      data: {
        polarProductIdMonthly: null,
        polarProductIdYearly: null,
      },
    });

    console.log(`✅ Reset Polar IDs for ${result.count} subscription plan(s)`);
    console.log("\nNext time you create a subscription with Polar, it will:");
    console.log("1. Create new products in your Polar account");
    console.log("2. Store the correct Polar product IDs in the database");
  } catch (error) {
    console.error("❌ Error resetting Polar IDs:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPolarIds();
