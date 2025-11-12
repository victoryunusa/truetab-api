const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create SuperAdmin
  const passwordHash = await bcrypt.hash('superadmin123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('✅ SuperAdmin ready:', superAdmin.email);

  // 2. Create Subscription Plans
  // const plans = [
  //   {
  //     name: "Basic",
  //     description: "For small restaurants with 1 branch",
  //     priceMonthly: 29,
  //     priceYearly: 290,
  //     currency: "USD",
  //     maxBranches: 1,
  //     maxStaff: 10,
  //     features: {
  //       orders: true,
  //       inventory: false,
  //       reporting: false,
  //     },
  //     trialDays: 14,
  //   },
  //   {
  //     name: "Pro",
  //     description: "For growing restaurants with multiple branches",
  //     priceMonthly: 79,
  //     priceYearly: 790,
  //     currency: "USD",
  //     maxBranches: 5,
  //     maxStaff: 50,
  //     features: {
  //       orders: true,
  //       inventory: true,
  //       reporting: true,
  //     },
  //     trialDays: 14,
  //   },
  //   {
  //     name: "Enterprise",
  //     description: "For chains and franchises",
  //     priceMonthly: 199,
  //     priceYearly: 1990,
  //     currency: "USD",
  //     maxBranches: null, // unlimited
  //     maxStaff: null, // unlimited
  //     features: {
  //       orders: true,
  //       inventory: true,
  //       reporting: true,
  //       aiForecasting: true,
  //       apiAccess: true,
  //     },
  //     trialDays: 30,
  //   },
  // ];

  // for (const plan of plans) {
  //   const created = await prisma.subscriptionPlan.upsert({
  //     where: { name_currency: { name: plan.name, currency: plan.currency } },
  //     update: {},
  //     create: plan,
  //   });
  //   console.log(`✅ Plan ready: ${created.name}`);
  // }

  console.log('🌱 Seeding complete!');
}

main()
  .catch(e => {
    console.error('❌ Seeding error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
