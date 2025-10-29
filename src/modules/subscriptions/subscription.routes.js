const router = require('express').Router();
const express = require('express');
const { auth } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const {
  listPlansController,
  subscribeBrandController,
  startTrialController,
  getBrandSubscriptionController,
  createCheckoutSessionController,
  createBillingPortalController,
  cancelSubscriptionController,
  reactivateSubscriptionController,
  changeSubscriptionPlanController,
} = require('./subscription.controller');
const { handleWebhook } = require('./webhook.controller');
const { handlePolarWebhook } = require('./polar-webhook.controller');
const {
  getBrandInvoicesController,
  getInvoiceByIdController,
  getInvoiceByNumberController,
  getPaymentSummaryController,
  downloadInvoicePDFController,
} = require('./invoice.controller');

// Stripe webhook (raw body applied in app.js)
router.post('/webhook', handleWebhook);

// Polar webhook (raw body applied in app.js)
router.post('/webhook/polar', express.raw({ type: 'application/json' }), handlePolarWebhook);

// Public list plans
router.get('/plans', listPlansController);

// Brand subscription ops
router.post(
  '/brands/:brandId/subscribe',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER'),
  subscribeBrandController
);

router.post(
  '/brands/:brandId/trial',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER'),
  startTrialController
);

router.get(
  '/brands/:brandId',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  getBrandSubscriptionController
);

// Create checkout session (Stripe or Polar)
router.post(
  '/brands/:brandId/checkout',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER'),
  createCheckoutSessionController
);

// Create billing portal session
router.post(
  '/brands/:brandId/billing-portal',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER'),
  createBillingPortalController
);

// Cancel subscription
router.post(
  '/brands/:brandId/cancel',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER'),
  cancelSubscriptionController
);

// Reactivate subscription
router.post(
  '/brands/:brandId/reactivate',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER'),
  reactivateSubscriptionController
);

// Change subscription plan
router.post(
  '/brands/:brandId/change-plan',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER'),
  changeSubscriptionPlanController
);

// ========== Invoice Routes ==========

// Get all invoices for a brand
router.get(
  '/brands/:brandId/invoices',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  getBrandInvoicesController
);

// Get payment summary for a brand
router.get(
  '/brands/:brandId/payment-summary',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  getPaymentSummaryController
);

// Get invoice by ID
router.get(
  '/invoices/:invoiceId',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  getInvoiceByIdController
);

// Get invoice by invoice number
router.get(
  '/invoices/number/:invoiceNumber',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  getInvoiceByNumberController
);

// Download invoice PDF
router.get(
  '/invoices/:invoiceId/download',
  auth(true),
  requireRole('SUPER_ADMIN', 'BRAND_OWNER', 'BRAND_ADMIN'),
  downloadInvoicePDFController
);

module.exports = router;
