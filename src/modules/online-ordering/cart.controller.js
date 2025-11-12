const cartService = require('./cart.service');

async function getCart(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { brandId } = req.query;

    const cart = await cartService.getOrCreateCart({
      sessionId,
      brandId,
    });

    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
}

async function addItem(req, res, next) {
  try {
    const { cartId, itemId, variantId, quantity, notes, modifiers } = req.body;

    const cart = await cartService.addToCart({
      cartId,
      itemId,
      variantId,
      quantity,
      notes,
      modifiers,
    });

    res.json({
      success: true,
      data: cart,
      message: 'Item added to cart',
    });
  } catch (error) {
    next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateCartItem(itemId, quantity);

    res.json({
      success: true,
      data: cart,
      message: 'Cart updated',
    });
  } catch (error) {
    next(error);
  }
}

async function removeItem(req, res, next) {
  try {
    const { itemId } = req.params;

    const cart = await cartService.removeFromCart(itemId);

    res.json({
      success: true,
      data: cart,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const { cartId } = req.params;

    const cart = await cartService.clearCart(cartId);

    res.json({
      success: true,
      data: cart,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
