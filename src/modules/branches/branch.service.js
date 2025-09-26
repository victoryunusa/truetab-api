const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBranch({ brandId, name, location, countryId, creatorUserId }) {
  if (!brandId) throw new Error('brandId is required');

  const [brand, country] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    //prisma.country.findUnique({ where: { id: countryId } }),
  ]);

  if (!brand) throw new Error('Invalid brandId');
  //if (!country) throw new Error('Invalid countryId');

  // create branch inside a transaction
  return prisma.$transaction(async tx => {
    const branch = await tx.branch.create({
      data: {
        brandId,
        name,
        location: location || null,
        countryId: brand.countryId,
        currency: brand.currency,
      },
    });

    // optionally auto-link creator to new branch
    if (creatorUserId) {
      await tx.userBranch.create({
        data: {
          userId: creatorUserId,
          branchId: branch.id,
          isActive: false, // don't auto-activate unless explicitly desired
        },
      });
    }

    return branch;
  });
}

async function listBranches({ brandId }) {
  return prisma.branch.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = { createBranch, listBranches };
