const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const { tenant } = require('../../middleware/tenant');
const walletController = require('./wallet.controller');

const guards = [auth(true), tenant(true)];

// Wallet summary & transactions
router.get('/summary', ...guards, walletController.getSummary);
router.get('/transactions', ...guards, walletController.getTransactions);

// Payouts
router.post('/payout/request', ...guards, walletController.requestPayout);
router.get('/payouts', ...guards, walletController.getPayouts);
router.post('/payout/:payoutId/cancel', ...guards, walletController.cancelPayout);

// Admin routes
router.post('/payout/:payoutId/process', ...guards, walletController.processPayout);

module.exports = router;
