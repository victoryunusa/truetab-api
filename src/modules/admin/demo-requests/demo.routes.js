const express = require('express');
const {
  requestDemoController,
  listDemoRequestsController,
  approveDemoRequestController,
  rejectDemoRequestController,
} = require('./demo.controller');
const { requireAdmin } = require('../../../middleware/rbac');

const router = express.Router();

// Public route
router.post('/request', requestDemoController);

// Admin routes
router.get('/', requireAdmin, listDemoRequestsController);
router.post('/:id/approve', requireAdmin, approveDemoRequestController);
router.post('/:id/reject', requireAdmin, rejectDemoRequestController);

module.exports = router;
