const prisma = require("../../lib/prisma");
const { stripe } = require("../../services/stripe.service");
const { nanoid } = require("nanoid");
const walletService = require("../wallet/wallet.service");

/**
 * Calculate order totals including tax and fees
 */
async function calculateOrderTotals({
  brandId,
  branchId = null,
  subtotal,
  deliveryFee = 0,
  orderType = "DELIVERY",
}) {
  let tax = 0;
  let serviceFee = 0;

  // Get applicable tax rates
  const taxRates = await prisma.taxRate.findMany({
    where: {
      brandId,
      isActive: true,
      ...(branchId && { branchId }),
    },
  });

  // Calculate tax
  for (const rate of taxRates) {
    if (rate.isInclusive) {
      // Tax already included in prices
      continue;
    }
    tax += (subtotal * Number(rate.ratePct)) / 100;
  }

  // Get service charge config if applicable
  const serviceChargeConfig = await prisma.serviceChargeConfig.findFirst({
    where: {
      brandId,
      isActive: true,
      ...(branchId && { branchId }),
    },
  });

  if (serviceChargeConfig) {
    if (serviceChargeConfig.type === "PERCENT") {
      serviceFee = (subtotal * Number(serviceChargeConfig.value)) / 100;
    } else {
      serviceFee = Number(serviceChargeConfig.value);
    }
  }

  const total = subtotal + tax + serviceFee + deliveryFee;

  return {
    subtotal,
    tax,
    serviceFee,
    deliveryFee,
    total,
  };
}

/**
 * Create online order from cart
 */
async function createOrderFromCart({
  cartId,
  customerId = null,
  customerName,
  customerEmail = null,
  customerPhone,
  deliveryAddress = null,
  orderType = "DELIVERY",
  scheduledFor = null,
  specialInstructions = null,
  deliveryFee = 0,
}) {
  // Get cart with items
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          item: true,
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Calculate subtotal
  const subtotal = cart.items.reduce((sum, item) => {
    const modifierTotal = Array.isArray(item.modifiers)
      ? item.modifiers.reduce((s, mod) => s + (Number(mod.price) || 0), 0)
      : 0;
    return sum + (Number(item.basePrice) + modifierTotal) * item.quantity;
  }, 0);

  // Calculate totals
  const totals = await calculateOrderTotals({
    brandId: cart.brandId,
    branchId: cart.branchId,
    subtotal,
    deliveryFee,
    orderType,
  });

  // Generate unique order number
  const orderNumber = `OL-${Date.now()}-${nanoid(6).toUpperCase()}`;

  // Create order with items using existing OrderItem model
  const order = await prisma.order.create({
    data: {
      orderNumber,
      brandId: cart.brandId,
      branchId: cart.branchId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      type: orderType,
      status: "DRAFT",
      isOnlineOrder: true,
      subtotal: totals.subtotal,
      tax: totals.tax,
      deliveryFee: totals.deliveryFee,
      service: totals.serviceFee,
      discount: 0,
      total: totals.total,
      paymentMethod: "stripe",
      paymentStatus: "PENDING",
      specialInstructions,
      scheduledFor,
      // Create order items
      items: {
        create: cart.items.map((cartItem) => {
          const modifierTotal = Array.isArray(cartItem.modifiers)
            ? cartItem.modifiers.reduce((sum, mod) => sum + (Number(mod.price) || 0), 0)
            : 0;
          const linePrice = (Number(cartItem.basePrice) + modifierTotal) * cartItem.quantity;

          return {
            itemId: cartItem.itemId,
            variantId: cartItem.variantId,
            quantity: cartItem.quantity,
            basePrice: cartItem.basePrice,
            linePrice,
            notes: cartItem.notes,
            // Create modifiers if any
            ...(Array.isArray(cartItem.modifiers) &&
              cartItem.modifiers.length > 0 && {
                modifiers: {
                  create: cartItem.modifiers.map((mod) => ({
                    optionId: mod.optionId,
                    price: mod.price,
                  })),
                },
              }),
          };
        }),
      },
    },
    include: {
      items: {
        include: {
          modifiers: true,
        },
      },
    },
  });

  // Clear cart
  await prisma.cartItem.deleteMany({
    where: { cartId },
  });

  return order;
}

/**
 * Create Stripe payment intent for online order
 */
async function createPaymentIntent(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.isOnlineOrder) {
    throw new Error("Not an online order");
  }

  if (order.paymentStatus !== "PENDING") {
    throw new Error("Order payment already processed");
  }

  // Get brand for currency
  const brand = await prisma.brand.findUnique({
    where: { id: order.brandId },
    select: { currency: true, name: true },
  });

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(order.total) * 100), // Convert to cents
    currency: brand.currency.toLowerCase(),
    description: `Order ${order.orderNumber} - ${brand.name}`,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      brandId: order.brandId,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Update order with payment intent
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentIntentId: paymentIntent.id,
      paymentStatus: "PROCESSING",
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Handle successful payment (called from webhook)
 */
async function handlePaymentSuccess(paymentIntentId) {
  const order = await prisma.order.findFirst({
    where: { paymentIntentId },
  });

  if (!order) {
    throw new Error("Order not found for payment intent");
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "SUCCEEDED",
      status: "CONFIRMED",
      paidAt: new Date(),
      paidTotal: order.total,
    },
  });

  // Calculate platform fee (e.g., 3% + $0.30)
  const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT || 3);
  const platformFeeFixed = Number(process.env.PLATFORM_FEE_FIXED || 0.3);
  const totalAmount = Number(order.total);
  const platformFee = (totalAmount * platformFeePercent) / 100 + platformFeeFixed;
  const restaurantAmount = totalAmount - platformFee;

  // Credit restaurant wallet
  await walletService.creditWallet({
    brandId: order.brandId,
    branchId: order.branchId,
    amount: restaurantAmount,
    type: "CREDIT",
    description: `Payment for order ${order.orderNumber}`,
    orderId: order.id,
    reference: paymentIntentId,
  });

  // Record platform fee
  await walletService.debitWallet({
    brandId: order.brandId,
    branchId: order.branchId,
    amount: platformFee,
    type: "FEE",
    description: `Platform fee for order ${order.orderNumber}`,
    orderId: order.id,
    reference: `fee-${paymentIntentId}`,
  });

  return updatedOrder;
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntentId, reason) {
  const order = await prisma.order.findFirst({
    where: { paymentIntentId },
  });

  if (!order) {
    return null;
  }

  return prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "FAILED",
      status: "CANCELLED",
      cancelReason: reason || "Payment failed",
      canceledAt: new Date(),
    },
  });
}

/**
 * Process refund for online order
 */
async function processRefund(orderId, amount = null, reason = null) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!order.isOnlineOrder) {
    throw new Error("Not an online order");
  }

  if (order.paymentStatus !== "SUCCEEDED") {
    throw new Error("Cannot refund unpaid order");
  }

  const refundAmount = amount || Number(order.total);

  // Create Stripe refund
  const refund = await stripe.refunds.create({
    payment_intent: order.paymentIntentId,
    amount: Math.round(refundAmount * 100), // Convert to cents
    reason: reason || "requested_by_customer",
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
  });

  // Update order status
  const isPartialRefund = refundAmount < Number(order.total);
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: isPartialRefund ? "PARTIALLY_REFUNDED" : "REFUNDED",
      status: "REFUNDED",
      canceledAt: new Date(),
      cancelReason: reason || "Refunded",
    },
  });

  // Debit restaurant wallet
  await walletService.debitWallet({
    brandId: order.brandId,
    branchId: order.branchId,
    amount: refundAmount,
    type: "REFUND",
    description: `Refund for order ${order.orderNumber}`,
    orderId: order.id,
    reference: refund.id,
  });

  return refund;
}

/**
 * Get order by ID
 */
async function getOrder(orderId) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          item: true,
          variant: true,
          modifiers: {
            include: {
              option: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get order by order number (for customer lookup)
 */
async function getOrderByNumber(orderNumber) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          item: true,
          variant: true,
          modifiers: {
            include: {
              option: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(status === "COMPLETED" && { completedAt: new Date() }),
      ...(status === "CANCELLED" && { canceledAt: new Date() }),
    },
  });
}

/**
 * Get orders for a brand/branch
 */
async function getOrders({ brandId, branchId = null, status = null, limit = 50, offset = 0 }) {
  return prisma.order.findMany({
    where: {
      brandId,
      isOnlineOrder: true,
      ...(branchId && { branchId }),
      ...(status && { status }),
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      items: {
        include: {
          item: true,
          variant: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip: offset,
  });
}

module.exports = {
  calculateOrderTotals,
  createOrderFromCart,
  createPaymentIntent,
  handlePaymentSuccess,
  handlePaymentFailure,
  processRefund,
  getOrder,
  getOrderByNumber,
  updateOrderStatus,
  getOrders,
};
