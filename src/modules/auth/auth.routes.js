const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const { requestDemoController } = require('../admin/demo-requests/demo.controller');
const {
  registerController,
  loginController,
  refreshController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
} = require('./auth.controller');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (tenant-scoped if brand/branch provided)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               role: { type: string, enum: [STAFF, BRAND_OWNER, BRAND_ADMIN, BRANCH_MANAGER] }
 *               brandId: { type: string, nullable: true }
 *               branchId: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/register', registerController);

router.post('/request', requestDemoController);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email & password
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/login', loginController);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for new tokens
 */
router.post('/refresh', refreshController);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate all refresh tokens for current user
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', auth(true), logoutController);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/forgot-password', forgotPasswordController);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/reset-password', resetPasswordController);

module.exports = router;
