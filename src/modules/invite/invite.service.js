const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyInviteToken, signAccessToken, signRefreshToken } = require('../../utils/jwt');
const bcrypt = require('bcrypt');

async function acceptInvite(token, { firstName, lastName, password }) {
  const decoded = verifyInviteToken(token);

  // prevent duplicate
  const existing = await prisma.user.findUnique({ where: { email: decoded.email } });
  if (existing) throw new Error('Invitation already accepted or user already exists');

  const brand = await prisma.brand.findUnique({ where: { id: decoded.brandId } });
  if (!brand) throw new Error('Brand no longer exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async tx => {
    const newUser = await tx.user.create({
      data: {
        email: decoded.email,
        firstName,
        lastName,
        password: hashedPassword,
        role: decoded.role,
        active: true,
        brand: { connect: { id: decoded.brandId } },
      },
    });

    if (decoded.branchIds?.length) {
      await tx.userBranch.createMany({
        data: decoded.branchIds.map((bid, i) => ({
          userId: newUser.id,
          branchId: bid,
          isActive: i === 0, // make the first branch active by default
        })),
        skipDuplicates: true,
      });

      // update currentBranchId to the first branch
      await tx.user.update({
        where: { id: newUser.id },
        data: { currentBranchId: decoded.branchIds[0] },
      });
    }

    return newUser;
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      currentBranchId: user.currentBranchId, // expose current branch
    },
    accessToken,
    refreshToken,
  };
}

module.exports = { acceptInvite };
