const router = require('express').Router();
const { auth } = require('../../middleware/auth');
const { tenant } = require('../../middleware/tenant');
const bankAccountController = require('./bank-account.controller');

const guards = [auth(true), tenant(true)];

router.get('/', ...guards, bankAccountController.list);
router.post('/', ...guards, bankAccountController.create);
router.get('/:id', ...guards, bankAccountController.get);
router.patch('/:id', ...guards, bankAccountController.update);
router.delete('/:id', ...guards, bankAccountController.remove);
router.post('/:id/set-default', ...guards, bankAccountController.setDefault);

// Admin only
router.post('/:id/verify', ...guards, bankAccountController.verify);

module.exports = router;
