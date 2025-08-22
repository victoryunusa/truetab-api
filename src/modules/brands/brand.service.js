const dayjs = require("dayjs");
const { PrismaClient, Role } = require("@prisma/client");
const prisma = new PrismaClient();

async function createBrand({ name, countryId, email, url, ownerId }) {
  // ensure owner exists
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) throw new Error("Owner not found");

  const country = await prisma.country.findUnique({
    where: { id: countryId },
  });
  if (!country) throw new Error("Invalid countryId");

  // pick a default plan (maybe "basic" or the first one in the db)
  const defaultPlan = await prisma.subscriptionPlan.findFirst({
    where: { isDefault: true },
  });
  if (!defaultPlan) throw new Error("No default plan configured");

  // create brand
  const brand = await prisma.brand.create({
    data: {
      name,
      countryId,
      email,
      url,
      currency: country.currency,
      ownerId,
    },
  });

  // update user profile with brandId
  await prisma.user.update({
    where: { id: ownerId },
    data: { brandId: brand.id },
  });

  // attach free trial subscription
  await prisma.subscription.create({
    data: {
      brandId: brand.id,
      status: "TRIALING",
      trialEndsAt: dayjs().add(14, "day").toDate(),
      currentPeriodEnd: dayjs().add(14, "day").toDate(),
      planId: defaultPlan.id,
    },
  });

  return brand;
}

async function listBrands({ user }) {
  if (user.role === Role.SUPER_ADMIN) {
    return prisma.brand.findMany({ orderBy: { createdAt: "desc" } });
  }
  // Owned or assigned
  return prisma.brand.findMany({
    where: {
      OR: [{ ownerId: user.id }, { users: { some: { id: user.id } } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { createBrand, listBrands };
