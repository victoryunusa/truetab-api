const { prisma } = require('../../lib/prisma');
const bcrypt = require('bcrypt');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const dayjs = require('dayjs');

async function register(data) {
  const {
    email,
    phone,
    password,
    firstName,
    lastName,
    code,
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

  // 2. Validate registration code
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

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. Run the full flow in a transaction
  const result = await prisma.$transaction(async tx => {
    // Create user
    const user = await tx.user.create({
      data: {
        email,
        phone,
        password: passwordHash,
        firstName,
        lastName,
        role: 'BRAND_OWNER', // Set as BRAND_OWNER for brand registration
      },
    });

    let brand = null;
    let branch = null;

    if (brandName && countryId) {
      const country = await tx.country.findUnique({ where: { id: countryId } });
      if (!country) throw new Error('Invalid countryId');

      // const defaultPlan = await tx.subscriptionPlan.findFirst({
      //   where: { isDefault: true },
      // });
      // if (!defaultPlan) throw new Error('No default plan configured');

      // Create brand
      brand = await tx.brand.create({
        data: {
          name: brandName,
          countryId,
          email: brandEmail || email,
          url: brandUrl ? `${brandUrl}.nineapp.site` : null,
          currency: country.currency,
          ownerId: user.id,
        },
      });

      // Update user with brandId
      await tx.user.update({
        where: { id: user.id },
        data: { brandId: brand.id },
      });

      // Free trial subscription
      // await tx.subscription.create({
      //   data: {
      //     brandId: brand.id,
      //     status: 'TRIALING',
      //     trialEndsAt: dayjs().add(14, 'day').toDate(),
      //     currentPeriodEnd: dayjs().add(14, 'day').toDate(),
      //     planId: defaultPlan.id,
      //   },
      // });

      // Create branch
      branch = await tx.branch.create({
        data: {
          brandId: brand.id,
          name: branchName || 'Main Branch',
          location: branchLocation || null,
          countryId,
          currency: country.currency,
        },
      });

      // Link user to branch (make it active by default)
      await tx.userBranch.create({
        data: {
          userId: user.id,
          branchId: branch.id,
          isActive: true,
        },
      });

      // Also set currentBranchId on user
      await tx.user.update({
        where: { id: user.id },
        data: { currentBranchId: branch.id },
      });
    }

    // Mark code as used
    await tx.registrationCode.update({
      where: { id: regCode.id },
      data: { isUsed: true },
    });

    return { user, brand, branch };
  });

  // Reload user with relations - THIS SHOULD WORK NOW
  const fullUser = await prisma.user.findUnique({
    where: { id: result.user.id },
    include: {
      brand: true,
      userBranches: {
        include: {
          branch: true,
        },
      },
      branches: true, // Also include direct branches relation
    },
  });

  //const tokens = await issueTokens(fullUser);

  return {
    user: publicUser(fullUser),
    brand: result.brand,
    branch: result.branch,
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
    currentBranchId: u.currentBranchId,
    brandId: u.brandId,
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
