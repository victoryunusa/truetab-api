const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { tenant } = require('../../middleware/tenant');
const { requireActiveSubscription, enforcePlanLimit } = require('../../middleware/subscription');
const {
  createBranchController,
  listBranchesController,
  getBranchController,
  updateBranchController,
  deleteBranchController,
  getBranchUsersController,
  getBranchStatsController,
} = require('./branch.controller');

// Apply auth and tenant middleware to all routes
router.use(auth(true), tenant(true), requireActiveSubscription());

// List branches in brand scope
router.get('/', listBranchesController);

// Get branch statistics
router.get('/stats', getBranchStatsController);

// Get specific branch details
router.get('/:branchId', getBranchController);

// Get users for a specific branch
router.get('/:branchId/users', getBranchUsersController);

// Create branch with plan limit check
router.post(
  '/',
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  enforcePlanLimit('maxBranches', async req => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    return prisma.branch.count({ where: { brandId: req.tenant.brandId } });
  }),
  createBranchController
);

// Update branch
router.put(
  '/:branchId',
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  updateBranchController
);

// Delete branch
router.delete('/:branchId', requireRole('SUPER_ADMIN', 'BRAND_OWNER'), deleteBranchController);

module.exports = router;
