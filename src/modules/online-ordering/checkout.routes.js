const router = require('express').Router();
const checkoutController = require('./checkout.controller');

// Public checkout routes
router.post('/create-order', checkoutController.createOrder);
router.post('/payment-intent/:orderId', checkoutController.createPaymentIntent);
router.get('/order/:orderNumber', checkoutController.getOrderByNumber);
router.get('/order/id/:orderId', checkoutController.getOrder);

// Protected admin routes (for restaurant staff)
const { auth } = require('../../middleware/auth');
const { tenant } = require('../../middleware/tenant');

router.get('/orders', auth(true), tenant(true), checkoutController.listOrders);

router.patch('/order/:orderId/status', auth(true), tenant(true), checkoutController.updateStatus);

router.post('/order/:orderId/refund', auth(true), tenant(true), checkoutController.processRefund);

module.exports = router;
