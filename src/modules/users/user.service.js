const { PrismaClient, Role } = require("@prisma/client");
const prisma = new PrismaClient();
const { signInviteToken } = require("../../utils/jwt");
const mailer = require("../../utils/mailer"); // assume simple mailer util

// Invite user
async function inviteUser({ inviterId, brandId, email, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  const token = signInviteToken({ email, role, brandId });
  // send email
  await mailer.sendMail({
    to: email,
    subject: "You're invited to join a brand on Truetab",
    text: `Accept invitation: ${process.env.APP_URL}/accept-invite?token=${token}`,
  });

  return { email, role, inviteToken: token };
}

// List users
async function listUsers({ brandId }) {
  return prisma.user.findMany({
    where: { brandId },
    select: {
      id: true,
      email: true,
      name: true,
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
