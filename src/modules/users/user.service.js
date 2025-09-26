const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
const { signInviteToken } = require('../../utils/jwt');
const mailer = require('../../utils/mailer'); // assume simple mailer util
const templateService = require('../../services/templateService');

// Invite user
// async function inviteUser({ inviterId, brandId, email, role }) {
//   const existing = await prisma.user.findUnique({ where: { email } });
//   if (existing) throw new Error('User already exists');

//   const token = signInviteToken({ email, role, brandId });
//   // send email
//   await mailer.sendMail({
//     to: email,
//     subject: "You're invited to join a brand on Truetab",
//     text: `Accept invitation: ${process.env.APP_URL}/accept-invite?token=${token}`,
//   });

//   return { email, role, inviteToken: token };
// }

async function inviteUser({ inviterId, brandId, email, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  console.log(inviterId);

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

  const token = signInviteToken({ email, role, brandId });
  const acceptUrl = `${process.env.APP_URL}/accept-invite?token=${token}`;

  const htmlContent = await templateService.renderTemplate('invitation-email', {
    inviterName: `${inviter.firstName} ${inviter.lastName}`,
    tenantName: tenant.name,
    role: role,
    acceptUrl: acceptUrl,
    appUrl: process.env.APP_URL,
  });

  await mailer.sendMail({
    to: email,
    subject: `🎉 Join ${tenant.name} on Nine`,
    html: htmlContent,
    text: `You're invited to join ${tenant.name} as ${role}. Accept here: ${acceptUrl}`,
  });

  return { email, role, brandId, inviteSent: true };
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

module.exports = {
  inviteUser,
  listUsers,
  updateUserRole,
  deactivateUser,
  updateProfile,
};
