const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const {
  registerController,
  loginController,
  refreshController,
  logoutController,
} = require("./auth.controller");

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
router.post("/register", registerController);

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
router.post("/login", loginController);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for new tokens
 */
router.post("/refresh", refreshController);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Invalidate all refresh tokens for current user
 *     security:
 *       - bearerAuth: []
 */
router.post("/logout", auth(true), logoutController);

module.exports = router;
