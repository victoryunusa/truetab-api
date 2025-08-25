const { PrismaClient, Role } = require("@prisma/client");
const prisma = new PrismaClient();

function tenant(requiredBrand = true) {
  return async (req, res, next) => {
    try {
      const brandId =
        req.headers["x-brand-id"] ||
        req.body?.brandId ||
        req.query.brandId ||
        null;
      const branchId =
        req.headers["x-branch-id"] ||
        req.body?.branchId ||
        req.query.branchId ||
        null;

      // Super admin can operate without brand/branch context unless requiredBrand=true
      if (!brandId && requiredBrand && req.user?.role !== Role.SUPER_ADMIN) {
        return res.status(400).json({ error: "brandId is required" });
      }

      // If not super admin, user must belong to this brand or own it
      if (brandId && req.user?.role !== Role.SUPER_ADMIN) {
        const belongs = await prisma.user.findFirst({
          where: {
            id: req.user.id,
            OR: [{ brandId }, { ownedBrands: { some: { id: brandId } } }],
          },
          select: { id: true },
        });
        if (!belongs) {
          return res.status(403).json({ error: "Forbidden (brand scope)" });
        }
      }

      if (branchId) {
        const branch = await prisma.branch.findFirst({
          where: { id: branchId, ...(brandId ? { brandId } : {}) },
        });
        if (!branch) {
          return res
            .status(404)
            .json({ error: "Branch not found in this brand" });
        }
      }

      req.tenant = { brandId: brandId || null, branchId: branchId || null };
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { tenant };
