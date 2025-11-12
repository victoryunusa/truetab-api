# Complete Routes & Controllers Implementation

## Status: Gateway implementations ✅ | Online menu routes ✅

This document contains all remaining route files and controllers you need to create.

---

## 1. Cart Routes & Controller

### File: `src/modules/online-ordering/cart.routes.js`

```javascript
const router = require("express").Router();
const cartController = require("./cart.controller");

// All cart routes are public (session-based)
router.get("/:sessionId", cartController.getCart);
router.post("/add", cartController.addItem);
router.patch("/item/:itemId", cartController.updateItem);
router.delete("/item/:itemId", cartController.removeItem);
router.delete("/:cartId/clear", cartController.clearCart);

module.exports = router;
```

### File: `src/modules/online-ordering/cart.controller.js`

```javascript
const cartService = require("./cart.service");

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
      message: "Item added to cart",
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
      message: "Cart updated",
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
      message: "Item removed from cart",
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
      message: "Cart cleared",
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
```

---

## 2. Checkout Routes & Controller

### File: `src/modules/online-ordering/checkout.routes.js`

```javascript
const router = require("express").Router();
const checkoutController = require("./checkout.controller");

// Public checkout routes
router.post("/create-order", checkoutController.createOrder);
router.post("/payment-intent/:orderId", checkoutController.createPaymentIntent);
router.get("/order/:orderNumber", checkoutController.getOrderByNumber);
router.get("/order/id/:orderId", checkoutController.getOrder);

// Protected admin routes (for restaurant staff)
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");

router.get(
  "/orders",
  auth(true),
  tenant(true),
  checkoutController.listOrders
);

router.patch(
  "/order/:orderId/status",
  auth(true),
  tenant(true),
  checkoutController.updateStatus
);

router.post(
  "/order/:orderId/refund",
  auth(true),
  tenant(true),
  checkoutController.processRefund
);

module.exports = router;
```

### File: `src/modules/online-ordering/checkout.controller.js`

```javascript
const checkoutService = require("./checkout.service");
const paymentGateway = require("../../services/payment-gateway.service");

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
      message: "Order created successfully",
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
        message: "Order not found",
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
        message: "Order not found",
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
      message: "Order status updated",
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
      message: "Refund processed successfully",
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
```

---

## 3. Wallet Routes & Controller

### File: `src/modules/wallet/wallet.routes.js`

```javascript
const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const walletController = require("./wallet.controller");

const guards = [auth(true), tenant(true)];

// Wallet summary & transactions
router.get("/summary", ...guards, walletController.getSummary);
router.get("/transactions", ...guards, walletController.getTransactions);

// Payouts
router.post("/payout/request", ...guards, walletController.requestPayout);
router.get("/payouts", ...guards, walletController.getPayouts);
router.post("/payout/:payoutId/cancel", ...guards, walletController.cancelPayout);

// Admin routes
router.post("/payout/:payoutId/process", ...guards, walletController.processPayout);

module.exports = router;
```

### File: `src/modules/wallet/wallet.controller.js`

```javascript
const walletService = require("./wallet.service");

async function getSummary(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId } = req.query;
    
    const summary = await walletService.getWalletSummary(brandId, branchId);
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

async function getTransactions(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, type, limit = 50, offset = 0 } = req.query;
    
    const transactions = await walletService.getTransactionHistory({
      brandId,
      branchId,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
}

async function requestPayout(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, amount, bankAccountId, method } = req.body;
    
    const payout = await walletService.requestPayout({
      brandId,
      branchId,
      amount,
      bankAccountId,
      method,
    });
    
    res.status(201).json({
      success: true,
      data: payout,
      message: "Payout requested successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function getPayouts(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, status, limit = 50, offset = 0 } = req.query;
    
    const payouts = await walletService.getPayouts({
      brandId,
      branchId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    next(error);
  }
}

async function cancelPayout(req, res, next) {
  try {
    const { payoutId } = req.params;
    
    const payout = await walletService.cancelPayout(payoutId);
    
    res.json({
      success: true,
      data: payout,
      message: "Payout cancelled",
    });
  } catch (error) {
    next(error);
  }
}

async function processPayout(req, res, next) {
  try {
    const { payoutId } = req.params;
    
    // Check if user is admin
    if (req.user.role !== "SUPER_ADMIN" && req.user.role !== "BRAND_OWNER") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to process payouts",
      });
    }
    
    const payout = await walletService.processPayout(payoutId);
    
    res.json({
      success: true,
      data: payout,
      message: "Payout processed successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  getTransactions,
  requestPayout,
  getPayouts,
  cancelPayout,
  processPayout,
};
```

---

## 4. Bank Account Routes & Controller

### File: `src/modules/wallet/bank-account.routes.js`

```javascript
const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const bankAccountController = require("./bank-account.controller");

const guards = [auth(true), tenant(true)];

router.get("/", ...guards, bankAccountController.list);
router.post("/", ...guards, bankAccountController.create);
router.get("/:id", ...guards, bankAccountController.get);
router.patch("/:id", ...guards, bankAccountController.update);
router.delete("/:id", ...guards, bankAccountController.remove);
router.post("/:id/set-default", ...guards, bankAccountController.setDefault);

// Admin only
router.post("/:id/verify", ...guards, bankAccountController.verify);

module.exports = router;
```

### File: `src/modules/wallet/bank-account.controller.js`

```javascript
const bankAccountService = require("./bank-account.service");

async function list(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId } = req.query;
    
    const accounts = await bankAccountService.getBankAccounts(brandId, branchId);
    
    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const { brandId } = req.user;
    const {
      branchId,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      routingNumber,
      swiftCode,
      iban,
      currency,
      isDefault,
    } = req.body;
    
    const account = await bankAccountService.addBankAccount({
      brandId,
      branchId,
      accountName,
      accountNumber,
      bankName,
      bankCode,
      routingNumber,
      swiftCode,
      iban,
      currency,
      isDefault,
    });
    
    res.status(201).json({
      success: true,
      data: account,
      message: "Bank account added successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const { id } = req.params;
    
    const account = await bankAccountService.getBankAccount(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }
    
    res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const account = await bankAccountService.updateBankAccount(id, updates);
    
    res.json({
      success: true,
      data: account,
      message: "Bank account updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    
    await bankAccountService.deleteBankAccount(id);
    
    res.json({
      success: true,
      message: "Bank account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function setDefault(req, res, next) {
  try {
    const { id } = req.params;
    
    const account = await bankAccountService.setDefaultBankAccount(id);
    
    res.json({
      success: true,
      data: account,
      message: "Default bank account updated",
    });
  } catch (error) {
    next(error);
  }
}

async function verify(req, res, next) {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    // Check if user is admin
    if (req.user.role !== "SUPER_ADMIN" && req.user.role !== "BRAND_OWNER") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to verify bank accounts",
      });
    }
    
    const account = await bankAccountService.verifyBankAccount(id, isVerified);
    
    res.json({
      success: true,
      data: account,
      message: `Bank account ${isVerified ? "verified" : "unverified"}`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  setDefault,
  verify,
};
```

---

## 5. Unified Webhook Handler

### File: `src/modules/online-ordering/webhook.controller.js`

```javascript
const checkoutService = require("./checkout.service");
const paymentGateway = require("../../services/payment-gateway.service");

async function handleWebhook(req, res, next) {
  try {
    const gateway = req.headers["x-payment-gateway"] || "stripe";
    const signature = req.headers["x-webhook-signature"] || 
                      req.headers["x-paystack-signature"] ||
                      req.headers["verif-hash"];
    
    // Verify webhook signature
    const event = paymentGateway.verifyWebhookSignature({
      payload: req.body,
      signature,
      gatewayName: gateway,
    });
    
    // Handle different event types
    switch (gateway) {
      case "stripe":
        await handleStripeEvent(event);
        break;
      case "paystack":
        await handlePaystackEvent(event);
        break;
      case "flutterwave":
        await handleFlutterwaveEvent(event);
        break;
      case "razorpay":
        await handleRazorpayEvent(event);
        break;
      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: error.message });
  }
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      await checkoutService.handlePaymentSuccess(event.data.object.id);
      break;
    case "payment_intent.payment_failed":
      await checkoutService.handlePaymentFailure(
        event.data.object.id,
        event.data.object.last_payment_error?.message
      );
      break;
  }
}

async function handlePaystackEvent(event) {
  switch (event.event) {
    case "charge.success":
      await checkoutService.handlePaymentSuccess(event.data.reference);
      break;
    case "charge.failed":
      await checkoutService.handlePaymentFailure(
        event.data.reference,
        event.data.gateway_response
      );
      break;
  }
}

async function handleFlutterwaveEvent(event) {
  if (event.event === "charge.completed" && event.data.status === "successful") {
    await checkoutService.handlePaymentSuccess(event.data.tx_ref);
  } else if (event.event === "charge.failed") {
    await checkoutService.handlePaymentFailure(
      event.data.tx_ref,
      event.data.processor_response
    );
  }
}

async function handleRazorpayEvent(event) {
  switch (event.event) {
    case "payment.captured":
      await checkoutService.handlePaymentSuccess(event.payload.payment.entity.order_id);
      break;
    case "payment.failed":
      await checkoutService.handlePaymentFailure(
        event.payload.payment.entity.order_id,
        event.payload.payment.entity.error_description
      );
      break;
  }
}

module.exports = {
  handleWebhook,
};
```

### File: `src/modules/online-ordering/webhook.routes.js`

```javascript
const router = require("express").Router();
const express = require("express");
const webhookController = require("./webhook.controller");

// Webhook routes need raw body for signature verification
router.post(
  "/payments",
  express.raw({ type: "application/json" }),
  webhookController.handleWebhook
);

module.exports = router;
```

---

## 6. Register All Routes in Main App

Add to your main app file (e.g., `src/app.js`):

```javascript
// Online Ordering & Wallet Routes
app.use("/api/online-menu", require("./modules/online-ordering/menu.routes"));
app.use("/api/cart", require("./modules/online-ordering/cart.routes"));
app.use("/api/checkout", require("./modules/online-ordering/checkout.routes"));
app.use("/api/wallet", require("./modules/wallet/wallet.routes"));
app.use("/api/wallet/bank-accounts", require("./modules/wallet/bank-account.routes"));
app.use("/api/webhooks", require("./modules/online-ordering/webhook.routes"));
```

---

## Summary

All routes and controllers are now complete! 

**Next steps:**
1. Copy these files to your project
2. Run `npm install razorpay` if not installed
3. Update `.env` with gateway credentials
4. Run `npx prisma generate && npx prisma db push`
5. Test the APIs!
