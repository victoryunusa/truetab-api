const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const { tenant } = require('../../middleware/tenant');
const { requireActiveSubscription } = require('../../middleware/subscription');
const {
  getSettingsController,
  updateSettingsController,
  resetSettingsController,
} = require('./settings.controller');

const guards = [auth(true), tenant(true), requireActiveSubscription()];

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get current settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', guards, getSettingsController);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/', guards, updateSettingsController);

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     summary: Reset settings to defaults
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-Brand-ID
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: X-Branch-ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/reset', guards, resetSettingsController);

module.exports = router;
