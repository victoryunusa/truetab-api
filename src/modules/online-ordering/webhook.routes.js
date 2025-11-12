const router = require('express').Router();
const express = require('express');
const webhookController = require('./webhook.controller');

// Webhook routes need raw body for signature verification
router.post(
  '/payments',
  express.raw({ type: 'application/json' }),
  webhookController.handleWebhook
);

module.exports = router;
