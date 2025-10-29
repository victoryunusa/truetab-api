const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBranch({ brandId, name, location, countryId, creatorUserId }) {
  if (!brandId) throw new Error('brandId is required');
  if (!name) throw new Error('name is required');

  const [brand, country] = await Promise.all([
    prisma.brand.findUnique({ where: { id: brandId } }),
    countryId ? prisma.country.findUnique({ where: { id: countryId } }) : null,
  ]);

  if (!brand) throw new Error('Invalid brandId');
  if (countryId && !country) throw new Error('Invalid countryId');

  // Check if branch name already exists for this brand
  const existingBranch = await prisma.branch.findFirst({
    where: {
      brandId,
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (existingBranch) {
    throw new Error('A branch with this name already exists for this brand');
  }

  // create branch inside a transaction
  return prisma.$transaction(async tx => {
    const branch = await tx.branch.create({
      data: {
        brandId,
        name,
        location: location || null,
        countryId: countryId || brand.countryId,
        currency: country?.currency || brand.currency,
      },
      include: {
        country: true,
        brand: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
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

async function listBranches({ brandId, includeUsers = false }) {
  const include = {
    country: true,
    _count: {
      select: {
        userBranches: true,
        Order: true,
      },
    },
  };

  if (includeUsers) {
    include.userBranches = {
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    };
  }

  return prisma.branch.findMany({
    where: { brandId },
    include,
    orderBy: { createdAt: 'desc' },
  });
}

async function getBranchById(branchId) {
  return prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      country: true,
      brand: {
        select: {
          id: true,
          name: true,
          currency: true,
        },
      },
      userBranches: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          userBranches: true,
          Order: true,
          Table: true,
        },
      },
    },
  });
}

async function updateBranch(branchId, data) {
  const { name, location, countryId, currency, defaultBillType } = data;

  // Check if branch exists
  const existingBranch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!existingBranch) {
    throw new Error('Branch not found');
  }

  // Check for duplicate name if name is being updated
  if (name && name !== existingBranch.name) {
    const duplicate = await prisma.branch.findFirst({
      where: {
        brandId: existingBranch.brandId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        id: { not: branchId },
      },
    });

    if (duplicate) {
      throw new Error('A branch with this name already exists for this brand');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (location !== undefined) updateData.location = location;
  if (countryId !== undefined) updateData.countryId = countryId;
  if (currency !== undefined) updateData.currency = currency;
  if (defaultBillType !== undefined) updateData.defaultBillType = defaultBillType;

  return prisma.branch.update({
    where: { id: branchId },
    data: updateData,
    include: {
      country: true,
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

async function deleteBranch(branchId) {
  // Check if branch exists
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      _count: {
        select: {
          Order: true,
          userBranches: true,
          Table: true,
        },
      },
    },
  });

  if (!branch) {
    throw new Error('Branch not found');
  }

  // Prevent deletion if there are associated records
  if (branch._count.Order > 0) {
    throw new Error('Cannot delete branch with existing orders');
  }

  if (branch._count.userBranches > 0) {
    throw new Error('Cannot delete branch with assigned users');
  }

  return prisma.$transaction(async tx => {
    // Delete branch-related records first
    await tx.userBranch.deleteMany({
      where: { branchId },
    });

    // Then delete the branch
    return tx.branch.delete({
      where: { id: branchId },
    });
  });
}

async function getBranchUsers(branchId) {
  const userBranches = await prisma.userBranch.findMany({
    where: { branchId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          active: true,
        },
      },
    },
    orderBy: {
      isActive: 'desc',
    },
  });

  return userBranches.map(ub => ({
    ...ub.user,
    isActiveInBranch: ub.isActive,
    userBranchId: ub.id,
  }));
}

async function getBranchStats(brandId) {
  const branches = await prisma.branch.findMany({
    where: { brandId },
    include: {
      _count: {
        select: {
          userBranches: true,
          Order: {
            where: {
              createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
              },
            },
          },
          Table: true,
        },
      },
    },
  });

  return branches.map(branch => ({
    id: branch.id,
    name: branch.name,
    location: branch.location,
    userCount: branch._count.userBranches,
    recentOrderCount: branch._count.Order,
    tableCount: branch._count.Table,
    createdAt: branch.createdAt,
  }));
}

module.exports = {
  createBranch,
  listBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchUsers,
  getBranchStats,
};
