const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  verifyInviteToken,
  signAccessToken,
  signRefreshToken,
} = require("../../utils/jwt");
const bcrypt = require("bcrypt");

async function acceptInvite(token, { firstName, lastName, password }) {
  const decoded = verifyInviteToken(token); // throws if invalid/expired

  // Prevent duplicate acceptance
  const existing = await prisma.user.findUnique({
    where: { email: decoded.email },
  });
  if (existing)
    throw new Error("Invitation already accepted or user already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: decoded.email,
      firstName,
      lastName,
      password: hashedPassword,
      role: decoded.role,
      active: true,
      // Use relation connection instead of direct brandId
      brand: {
        connect: {
          id: decoded.brandId,
        },
      },
    },
  });

  // Issue login tokens immediately
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    user: { id: user.id, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
}

module.exports = { acceptInvite };
