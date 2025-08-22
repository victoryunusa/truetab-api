const { prisma } = require("../../lib/prisma");
const bcrypt = require("bcrypt");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../utils/jwt");

async function register(data) {
  const { email, password, firstName, lastName, role, brandId, branchId } =
    data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const e = new Error("Email already in use");
    e.status = 409;
    throw e;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      firstName,
      lastName,
      role,
      brandId: brandId || null,
      branchId: branchId || null,
    },
  });

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const e = new Error("Invalid credentials");
    e.status = 401;
    throw e;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const e = new Error("Invalid credentials");
    e.status = 401;
    throw e;
  }

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

async function refresh({ refreshToken }) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    const e = new Error("Invalid refresh token");
    e.status = 401;
    throw e;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  // version check for revocation
  if ((decoded.tokenVersion ?? 0) !== user.refreshTokenVersion) {
    const e = new Error("Refresh token revoked");
    e.status = 401;
    throw e;
  }

  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

async function logout(userId) {
  // Bump version to invalidate all existing refresh tokens for this user
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenVersion: { increment: 1 } },
  });
  return { ok: true };
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    brandId: u.brandId,
    branchId: u.branchId,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

async function issueTokens(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    brandId: user.brandId || null,
    branchId: user.branchId || null,
    tokenVersion: user.refreshTokenVersion || 0,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
