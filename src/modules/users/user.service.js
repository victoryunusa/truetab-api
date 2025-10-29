const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
const { signInviteToken } = require('../../utils/jwt');
const mailer = require('../../utils/mailer');
const templateService = require('../../services/templateService');

// Invite user
async function inviteUser({ inviterId, brandId, email, role, branchIds = [] }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const [inviter, tenant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: inviterId },
      select: { firstName: true, lastName: true },
    }),
    prisma.brand.findUnique({
      where: { id: brandId },
      select: { name: true },
    }),
  ]);

  if (!tenant) throw new Error('Invalid brandId');

  // include branches in token so they can be assigned after registration
  const token = signInviteToken({ email, role, brandId, branchIds });
  const acceptUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

  const htmlContent = await templateService.renderTemplate('invitation-email', {
    inviterName: `${inviter?.firstName ?? ''} ${inviter?.lastName ?? ''}`,
    tenantName: tenant.name,
    role,
    acceptUrl,
    appUrl: process.env.FRONTEND_URL,
  });

  await mailer.sendMail({
    to: email,
    subject: `🎉 Join ${tenant.name} on Nine`,
    html: htmlContent,
    text: `You're invited to join ${tenant.name} as ${role}. Accept here: ${acceptUrl}`,
  });

  return { email, role, brandId, branchIds, inviteSent: true };
}

// List users
async function listUsers({ brandId }) {
  return prisma.user.findMany({
    where: { brandId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
      createdAt: true,
      currentBranchId: true,
      userBranches: {
        include: {
          branch: true,
        },
      },
    },
  });
}

// Update user role
async function updateUserRole({ userId, brandId, role }) {
  return prisma.user.update({
    where: { id: userId, brandId },
    data: { role },
  });
}

// Deactivate user
async function deactivateUser({ userId, brandId }) {
  return prisma.user.update({
    where: { id: userId, brandId },
    data: { active: false },
  });
}

// Update profile
async function updateProfile(userId, data) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

async function getProfile(userId) {
  console.log('Getting profile for user:', userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      brand: true,
      userBranches: {
        // FIXED: Changed from 'branches' to 'userBranches'
        include: {
          branch: true,
        },
      },
      branch: true, // Include current branch relation
    },
  });

  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }

  const cleanedUser = publicUser(user);
  return cleanedUser;
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    brandId: u.brandId,
    brand: u.brand,
    currentBranchId: u.currentBranchId,
    currentBranch: u.branch, // Current branch object
    userBranches: u.userBranches.map(ub => ({
      // FIXED: Changed from 'branches' to 'userBranches'
      id: ub.id,
      isActive: ub.isActive,
      createdAt: ub.createdAt,
      updatedAt: ub.updatedAt,
      branch: ub.branch,
    })),
  };
}

async function switchBranch(userId, branchId) {
  return await prisma.$transaction(async tx => {
    // Deactivate all user branches
    await tx.userBranch.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Check if user is already assigned to this branch
    const existingUserBranch = await tx.userBranch.findUnique({
      where: { userId_branchId: { userId, branchId } },
    });

    if (existingUserBranch) {
      // Activate the existing branch assignment
      await tx.userBranch.update({
        where: { userId_branchId: { userId, branchId } },
        data: { isActive: true },
      });
    } else {
      // Create new branch assignment and activate it
      await tx.userBranch.create({
        data: {
          userId,
          branchId,
          isActive: true,
        },
      });
    }

    // Update user's current branch
    return tx.user.update({
      where: { id: userId },
      data: { currentBranchId: branchId },
      include: {
        brand: true,
        userBranches: {
          // FIXED: Changed from 'branches' to 'userBranches'
          include: {
            branch: true,
          },
        },
        branch: true, // Include current branch
      },
    });
  });
}

async function assignUserToBranch(userId, branchId) {
  // Check if assignment already exists
  const existing = await prisma.userBranch.findUnique({
    where: { userId_branchId: { userId, branchId } },
  });

  if (existing) {
    return existing;
  }

  return prisma.userBranch.create({
    data: {
      userId,
      branchId,
      isActive: false,
    },
  });
}

// Get user's accessible branches
async function getUserBranches(userId) {
  const userBranches = await prisma.userBranch.findMany({
    where: { userId },
    include: {
      branch: {
        include: {
          brand: true,
        },
      },
    },
    orderBy: {
      isActive: 'desc', // Active branches first
    },
  });

  return userBranches.map(ub => ({
    ...ub.branch,
    isActive: ub.isActive,
    userBranchId: ub.id,
  }));
}

// Remove user from branch
async function removeUserFromBranch(userId, branchId) {
  return prisma.userBranch.delete({
    where: { userId_branchId: { userId, branchId } },
  });
}

module.exports = {
  inviteUser,
  listUsers,
  updateUserRole,
  deactivateUser,
  updateProfile,
  getProfile,
  switchBranch,
  assignUserToBranch,
  getUserBranches,
  removeUserFromBranch,
};
