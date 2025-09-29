const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { tenant } = require('../../middleware/tenant');
const {
  inviteUserController,
  listUsersController,
  updateUserRoleController,
  deactivateUserController,
  updateProfileController,
  assignUserToBranchController,
  switchBranchController,
  getProfileController,
} = require('./user.controller');

// List users in brand
router.get(
  '/',
  auth(true),
  tenant(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  listUsersController
);

// Invite user
router.post(
  '/invite',
  auth(true),
  tenant(true),
  requireRole('BRAND_OWNER', 'BRAND_ADMIN'),
  inviteUserController
);

// Update role
router.put(
  '/:userId/role',
  auth(true),
  tenant(true),
  requireRole('BRAND_OWNER', 'BRAND_ADMIN'),
  updateUserRoleController
);

// Deactivate user
router.delete(
  '/:userId',
  auth(true),
  tenant(true),
  requireRole('BRAND_OWNER', 'BRAND_ADMIN'),
  deactivateUserController
);

// Update profile (self-service)
router.put('/me', auth(true), updateProfileController);
router.get('/me', auth(true), getProfileController);

// Assign user to branch
router.post(
  '/assign-branch',
  auth(true),
  tenant(true),
  requireRole('BRAND_OWNER', 'BRAND_ADMIN'),
  assignUserToBranchController
);

// Switch branch (self-service)
router.post('/switch-branch', auth(true), switchBranchController);

module.exports = router;
