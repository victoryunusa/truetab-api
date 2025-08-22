const { PrismaClient } = require('@prisma/client');

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  }
  return prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

process.on('SIGINT', async () => {
  if (prisma) {
    await prisma.$disconnect();
    process.exit(0);
  }
});

module.exports = { prisma: getPrismaClient() };
