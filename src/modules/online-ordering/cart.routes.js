const router = require('express').Router();
const cartController = require('./cart.controller');

// All cart routes are public (session-based)
router.get('/:sessionId', cartController.getCart);
router.post('/add', cartController.addItem);
router.patch('/item/:itemId', cartController.updateItem);
router.delete('/item/:itemId', cartController.removeItem);
router.delete('/:cartId/clear', cartController.clearCart);

module.exports = router;
