const { prisma } = require('../../lib/prisma');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const dayjs = require('dayjs');

async function register(data) {
  const {
    email,
    password,
    firstName,
    lastName,
    code,
    role,
    brandName,
    countryId,
    brandEmail,
    brandUrl,
    branchName,
    branchLocation,
  } = data;

  // 1. Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const e = new Error('Email already in use');
    e.status = 409;
    throw e;
  }

  // check registration code
  const regCode = await prisma.registrationCode.findUnique({ where: { code } });
  if (!regCode || regCode.isUsed || regCode.expiresAt < new Date()) {
    const e = new Error('Invalid or expired registration code');
    e.status = 401;
    throw e;
  }

  if (regCode.email !== email) {
    const e = new Error('Code does not match this email');
    e.status = 401;
    throw e;
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Create user first (without brandId/branchId yet)
  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      firstName,
      lastName,
      role,
    },
  });

  let brand = null;
  let branch = null;

  // 4. If brand info is provided, create brand + subscription
  if (brandName && countryId) {
    const country = await prisma.country.findUnique({ where: { id: countryId } });
    if (!country) throw new Error('Invalid countryId');

    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true },
    });
    if (!defaultPlan) throw new Error('No default plan configured');

    brand = await prisma.brand.create({
      data: {
        name: brandName,
        countryId,
        email: brandEmail || email,
        url: brandUrl || null,
        currency: country.currency,
        ownerId: user.id,
      },
    });

    // attach brandId to user
    await prisma.user.update({
      where: { id: user.id },
      data: { brandId: brand.id },
    });

    // free trial subscription
    await prisma.subscription.create({
      data: {
        brandId: brand.id,
        status: 'TRIALING',
        trialEndsAt: dayjs().add(14, 'day').toDate(),
        currentPeriodEnd: dayjs().add(14, 'day').toDate(),
        planId: defaultPlan.id,
      },
    });

    // 5. Create default branch
    branch = await prisma.branch.create({
      data: {
        brandId: brand.id,
        name: branchName || 'Main Branch',
        location: branchLocation || null,
        countryId: countryId,
        currency: country.currency,
      },
    });

    // attach branchId to user
    await prisma.user.update({
      where: { id: user.id },
      data: { branchId: branch.id },
    });
  }

  // mark code as used
  await prisma.registrationCode.update({
    where: { id: regCode.id },
    data: { isUsed: true },
  });

  const tokens = await issueTokens(await prisma.user.findUnique({ where: { id: user.id } }));

  return {
    user: publicUser(user),
    brand,
    branch,
    ...tokens,
  };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const e = new Error('Invalid credentials');
    e.status = 401;
    throw e;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const e = new Error('Invalid credentials');
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
    const e = new Error('Invalid refresh token');
    e.status = 401;
    throw e;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }

  // version check for revocation
  if ((decoded.tokenVersion ?? 0) !== user.refreshTokenVersion) {
    const e = new Error('Refresh token revoked');
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
