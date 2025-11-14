const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const deliveryProviders = [
  {
    name: 'UBER_EATS',
    displayName: 'Uber Eats',
    isActive: true,
    apiEndpoint: 'https://api.uber.com/v2/eats',
    webhookSecret: null,
  },
  {
    name: 'DOORDASH',
    displayName: 'DoorDash',
    isActive: true,
    apiEndpoint: 'https://openapi.doordash.com/drive/v2',
    webhookSecret: null,
  },
  {
    name: 'GRUBHUB',
    displayName: 'Grubhub',
    isActive: true,
    apiEndpoint: 'https://api-gtm.grubhub.com/v1',
    webhookSecret: null,
  },
  {
    name: 'JUST_EAT',
    displayName: 'Just Eat',
    isActive: true,
    apiEndpoint: 'https://api.just-eat.co.uk/v1',
    webhookSecret: null,
  },
  {
    name: 'DELIVEROO',
    displayName: 'Deliveroo',
    isActive: true,
    apiEndpoint: 'https://api.deliveroo.com/v1',
    webhookSecret: null,
  },
];

async function seedDeliveryProviders() {
  console.log('🚀 Seeding delivery providers...');

  for (const provider of deliveryProviders) {
    const existing = await prisma.deliveryProvider.findUnique({
      where: { name: provider.name },
    });

    if (existing) {
      console.log(`✓ Provider "${provider.displayName}" already exists, skipping`);
      continue;
    }

    await prisma.deliveryProvider.create({
      data: provider,
    });

    console.log(`✓ Created provider: ${provider.displayName}`);
  }

  console.log('✅ Delivery providers seeded successfully!');
}

// Run if executed directly
if (require.main === module) {
  seedDeliveryProviders()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding delivery providers:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedDeliveryProviders };
