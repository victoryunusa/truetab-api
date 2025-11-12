const prisma = require("../../lib/prisma");
const { nanoid } = require("nanoid");

/**
 * Get or create cart for session/customer
 */
async function getOrCreateCart({ sessionId, customerId = null, brandId }) {
  let cart = await prisma.cart.findFirst({
    where: {
      OR: [
        { sessionId },
        customerId ? { customerId } : { sessionId: "never-match" },
      ],
    },
    include: {
      items: {
        include: {
          item: {
            select: {
              id: true,
              defaultName: true,
              imageUrl: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    // Create new cart with 24-hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    cart = await prisma.cart.create({
      data: {
        sessionId: sessionId || nanoid(),
        customerId,
        brandId,
        expiresAt,
      },
      include: {
        items: true,
      },
    });
  }

  return cart;
}

/**
 * Add item to cart
 */
async function addToCart({
  cartId,
  itemId,
  variantId = null,
  quantity = 1,
  notes = null,
  modifiers = [],
}) {
  // Get item and variant details
  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: {
      variants: variantId
        ? {
            where: { id: variantId },
          }
        : true,
    },
  });

  if (!item || !item.isActive) {
    throw new Error("Item not found or inactive");
  }

  // Determine base price
  let basePrice;
  if (variantId) {
    const variant = item.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }
    basePrice = variant.price;
  } else if (item.variants.length === 1) {
    basePrice = item.variants[0].price;
    variantId = item.variants[0].id;
  } else {
    throw new Error("Variant must be specified for items with multiple variants");
  }

  // Check if item already exists in cart with same modifiers
  const existingCartItem = await prisma.cartItem.findFirst({
    where: {
      cartId,
      itemId,
      variantId,
      notes,
    },
  });

  let cartItem;

  if (existingCartItem) {
    // Update quantity
    cartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: existingCartItem.quantity + quantity,
      },
    });
  } else {
    // Create new cart item
    cartItem = await prisma.cartItem.create({
      data: {
        cartId,
        itemId,
        variantId,
        quantity,
        basePrice,
        notes,
        modifiers: modifiers || [],
      },
    });
  }

  // Update cart expiry
  const newExpiry = new Date();
  newExpiry.setHours(newExpiry.getHours() + 24);
  await prisma.cart.update({
    where: { id: cartId },
    data: { expiresAt: newExpiry },
  });

  return getCart(cartId);
}

/**
 * Update cart item quantity
 */
async function updateCartItem(cartItemId, quantity) {
  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
  });

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: { cartId: true },
  });

  return getCart(cartItem.cartId);
}

/**
 * Remove item from cart
 */
async function removeFromCart(cartItemId) {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    select: { cartId: true },
  });

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  return getCart(cartItem.cartId);
}

/**
 * Get cart with calculated totals
 */
async function getCart(cartId) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          item: {
            select: {
              id: true,
              defaultName: true,
              imageUrl: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return null;
  }

  // Calculate totals
  const itemsWithTotals = cart.items.map((item) => {
    const modifierTotal = Array.isArray(item.modifiers)
      ? item.modifiers.reduce((sum, mod) => sum + (Number(mod.price) || 0), 0)
      : 0;

    const lineTotal = (Number(item.basePrice) + modifierTotal) * item.quantity;

    return {
      ...item,
      modifierTotal,
      lineTotal,
    };
  });

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    ...cart,
    items: itemsWithTotals,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
  };
}

/**
 * Clear all items from cart
 */
async function clearCart(cartId) {
  await prisma.cartItem.deleteMany({
    where: { cartId },
  });

  return getCart(cartId);
}

/**
 * Delete expired carts (run as cron job)
 */
async function cleanupExpiredCarts() {
  const result = await prisma.cart.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

module.exports = {
  getOrCreateCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  getCart,
  clearCart,
  cleanupExpiredCarts,
};
