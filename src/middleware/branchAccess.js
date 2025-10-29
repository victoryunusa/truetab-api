// middleware/branchAccess.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function requireBranchAccess(req, res, next) {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        error: 'Branch ID is required',
      });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, brandId: true, name: true },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: 'Branch not found',
      });
    }

    // Check if branch belongs to user's brand
    if (branch.brandId !== req.tenant.brandId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this branch',
      });
    }

    // Attach branch to request for later use
    req.branch = branch;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = { requireBranchAccess };
