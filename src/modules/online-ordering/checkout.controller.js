const checkoutService = require('./checkout.service');
const paymentGateway = require('../../services/payment-gateway.service');

async function createOrder(req, res, next) {
  try {
    const {
      cartId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      orderType,
      scheduledFor,
      specialInstructions,
      deliveryFee,
    } = req.body;

    const order = await checkoutService.createOrderFromCart({
      cartId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      orderType,
      scheduledFor,
      specialInstructions,
      deliveryFee,
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function createPaymentIntent(req, res, next) {
  try {
    const { orderId } = req.params;

    const payment = await checkoutService.createPaymentIntent(orderId);

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await checkoutService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function getOrderByNumber(req, res, next) {
  try {
    const { orderNumber } = req.params;

    const order = await checkoutService.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, status, limit = 50, offset = 0 } = req.query;

    const orders = await checkoutService.getOrders({
      brandId,
      branchId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await checkoutService.updateOrderStatus(orderId, status);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated',
    });
  } catch (error) {
    next(error);
  }
}

async function processRefund(req, res, next) {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    const refund = await checkoutService.processRefund(orderId, amount, reason);

    res.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  createPaymentIntent,
  getOrder,
  getOrderByNumber,
  listOrders,
  updateStatus,
  processRefund,
};
