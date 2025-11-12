# Online Ordering & Wallet System - Implementation Summary

## ✅ What Has Been Implemented

> **🎉 Architecture Improvement**: We use a **unified Order model** instead of separate POS and online order tables. This means all orders (dine-in, takeaway, delivery, online) are stored in the same `Order` table with an `isOnlineOrder` flag. See [UNIFIED_ORDER_MODEL.md](UNIFIED_ORDER_MODEL.md) for details.

### 1. Database Schema (Prisma)

**New/Enhanced Models:**
- ✅ `OnlineMenu` - Menu configuration with QR codes
- ✅ `Cart` & `CartItem` - Shopping cart management
- ✅ `Order` (ENHANCED) - **Unified model** for both POS and online orders
- ✅ `RestaurantWallet` - Balance and earnings management
- ✅ `WalletTransaction` - Transaction history
- ✅ `Payout` - Payout requests and processing
- ✅ `BankAccount` - Bank account management

**New/Enhanced Enums:**
- `OrderStatus` (ENHANCED) - Added CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, COMPLETED
- `PaymentStatus` - Online payment status tracking
- `WalletTransactionType` (CREDIT, DEBIT, REFUND, FEE, PAYOUT)
- `TransactionStatus` (PENDING → COMPLETED)
- `PayoutStatus` (PENDING → COMPLETED/FAILED)
- `PayoutMethod` (BANK_TRANSFER, STRIPE_CONNECT, MANUAL)

### 2. Service Layer

**Online Ordering Module** (`src/modules/online-ordering/`)
- ✅ `menu.service.js` - Public menu and QR code generation
- ✅ `cart.service.js` - Cart management with 24-hour expiry
- ✅ `checkout.service.js` - Order creation, payment processing, refunds

**Wallet Module** (`src/modules/wallet/`)
- ✅ `wallet.service.js` - Balance management, transactions, payouts
- ✅ `bank-account.service.js` - Bank account CRUD operations

### 3. Key Features

#### Online Menu System
```javascript
// Create menu with QR code
createOnlineMenu({ brandId, branchId, settings })
// Returns: { id, urlSlug, qrCode (base64), menuUrl }

// Public menu access (no auth required)
getPublicMenu(urlSlug)
// Returns: Full menu with categories, items, variants, modifiers
```

#### Shopping Cart
```javascript
// Session-based carts (guest users)
getOrCreateCart({ sessionId, brandId })

// Add items with modifiers
addToCart({ cartId, itemId, variantId, quantity, modifiers })

// Auto-expires after 24 hours
```

#### Checkout & Payment
```javascript
// Create order from cart (unified Order model)
createOrderFromCart({ 
  cartId, 
  customerName, 
  customerPhone, 
  deliveryAddress,
  orderType: 'DELIVERY' 
})
// Creates Order with isOnlineOrder: true

// Create Stripe payment
createPaymentIntent(orderId)
// Returns: { clientSecret, paymentIntentId }

// Webhook handles payment success
handlePaymentSuccess(paymentIntentId)
// → Credits restaurant wallet
// → Deducts platform fee
// → Marks order as CONFIRMED
// → Updates Order.paymentStatus = 'SUCCEEDED'
```

#### Restaurant Wallet
```javascript
// Automatic credit on payment
creditWallet({ 
  brandId, 
  amount, 
  description, 
  onlineOrderId 
})

// Check balance
getWalletSummary(brandId)
// Returns: { balance, pendingPayouts, availableBalance }

// View transactions
getTransactionHistory({ brandId, type, limit })
```

#### Payout System
```javascript
// Request payout
requestPayout({ 
  brandId, 
  amount, 
  bankAccountId, 
  method: 'BANK_TRANSFER' 
})

// Process payout (admin or automated)
processPayout(payoutId)
// → Debits wallet
// → Creates Stripe transfer (if Connect enabled)
// → Updates status to COMPLETED
```

## 🔄 Next Steps (To Complete the System)

### Phase 1: API Routes & Controllers
You need to create route handlers and controllers for:

1. **Online Menu Routes** (`src/modules/online-ordering/menu.routes.js`)
   - POST `/api/online-menu/create`
   - GET `/api/online-menu/:brandId`
   - GET `/api/online-menu/public/:urlSlug` (no auth)
   - PATCH `/api/online-menu/:menuId/settings`

2. **Cart Routes** (`src/modules/online-ordering/cart.routes.js`)
   - GET `/api/cart/:sessionId`
   - POST `/api/cart/add`
   - PATCH `/api/cart/item/:itemId`
   - DELETE `/api/cart/item/:itemId`

3. **Checkout Routes** (`src/modules/online-ordering/checkout.routes.js`)
   - POST `/api/online-orders/checkout`
   - POST `/api/online-orders/:orderId/payment-intent`
   - GET `/api/online-orders/:orderId`
   - PATCH `/api/online-orders/:orderId/status`
   - POST `/api/online-orders/:orderId/refund`

4. **Wallet Routes** (`src/modules/wallet/wallet.routes.js`)
   - GET `/api/wallet/summary`
   - GET `/api/wallet/transactions`
   - POST `/api/wallet/payout/request`
   - GET `/api/wallet/payouts`
   - POST `/api/wallet/payout/:payoutId/process` (admin)

5. **Bank Account Routes** (`src/modules/wallet/bank-account.routes.js`)
   - POST `/api/wallet/bank-accounts`
   - GET `/api/wallet/bank-accounts`
   - PATCH `/api/wallet/bank-accounts/:id`
   - DELETE `/api/wallet/bank-accounts/:id`

### Phase 2: Webhook Integration

Update existing Stripe webhook handler to handle online order payments:

```javascript
// In src/modules/subscriptions/webhook.controller.js
// Or create new src/modules/online-ordering/webhook.controller.js

case 'payment_intent.succeeded':
  await checkoutService.handlePaymentSuccess(paymentIntent.id);
  break;

case 'payment_intent.payment_failed':
  await checkoutService.handlePaymentFailure(paymentIntent.id);
  break;
```

### Phase 3: Frontend Integration

Create frontend components for:
1. Public menu display (customer-facing)
2. Cart UI with item customization
3. Checkout form with Stripe Elements
4. Order tracking page
5. Restaurant dashboard for:
   - Viewing online orders
   - Managing online menu
   - Viewing wallet balance
   - Requesting payouts
   - Managing bank accounts

### Phase 4: Additional Features

1. **Real-time Updates**
   - WebSocket notifications for new orders
   - Order status updates for customers

2. **Email Notifications**
   - Order confirmation emails
   - Order status updates
   - Payout notifications

3. **Admin Dashboard**
   - Payout approval workflow
   - Bank account verification
   - Platform fee configuration
   - Analytics and reporting

4. **Testing**
   - Unit tests for services
   - Integration tests for payment flow
   - End-to-end tests for order flow

## 📊 Database Migration

Before using the system, run:

```bash
# Generate Prisma client
npx prisma generate

# Apply schema changes
npx prisma db push

# Or create a migration
npx prisma migrate dev --name add_online_ordering_wallet
```

## 🔐 Environment Variables Required

Add to your `.env` file:

```env
# Online Ordering
ONLINE_MENU_BASE_URL=https://order.yourdomain.com
PLATFORM_FEE_PERCENT=3
PLATFORM_FEE_FIXED=0.30

# Stripe (already exists, but ensure these are set)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Wallet & Payouts
MIN_PAYOUT_AMOUNT=100
AUTO_PAYOUT_ENABLED=false
AUTO_PAYOUT_THRESHOLD=1000
```

## 📖 Documentation

- **Full Guide**: See [ONLINE_ORDERING_GUIDE.md](ONLINE_ORDERING_GUIDE.md)
- **API Endpoints**: Detailed endpoint documentation in the guide
- **Workflows**: Complete flow diagrams for orders, payments, and payouts
- **Security**: Best practices and considerations

## 💡 Key Design Decisions

1. **Platform Fee Model**: Percentage + fixed fee (like Stripe, Uber Eats)
2. **Wallet System**: Separate wallet per brand (not per branch, though supported)
3. **Payout Flow**: Manual approval by default, optional automation
4. **Cart Expiry**: 24-hour TTL to prevent abandoned cart buildup
5. **Order Snapshot**: Items stored as JSON to preserve historical data
6. **Payment First**: Orders created before payment, but only confirmed after success

## 🎯 Business Logic

### Order Payment Flow
```
Customer pays $100
├─ Stripe charges $100 + Stripe fee ($2.90 + $0.30 = $3.20)
├─ Platform receives $96.80
├─ Platform takes 3% + $0.30 = $3.30
└─ Restaurant receives $96.70 in wallet
```

### Payout Flow
```
Restaurant wallet: $500
├─ Request payout: $400
├─ Check minimum ($100) ✓
├─ Check available balance ✓
├─ Create PENDING payout
├─ Admin approves (optional)
├─ Process payout
│   ├─ Debit wallet: -$400
│   ├─ Create Stripe transfer (if Connect)
│   └─ Or mark for manual bank transfer
└─ Status: COMPLETED
```

## 🚀 Quick Start

1. **Apply database schema**:
   ```bash
   npx prisma db push
   ```

2. **Create online menu for a brand**:
   ```javascript
   const menu = await createOnlineMenu({
     brandId: 'brand-uuid',
     settings: { theme: 'modern', primaryColor: '#FF5722' }
   });
   // QR code ready to print!
   ```

3. **Test cart and checkout**:
   ```javascript
   const cart = await getOrCreateCart({ sessionId: 'session-123', brandId: 'brand-uuid' });
   await addToCart({ cartId: cart.id, itemId: 'item-uuid', quantity: 2 });
   const order = await createOrderFromCart({ cartId: cart.id, customerName: 'John Doe', ... });
   const payment = await createPaymentIntent(order.id);
   ```

4. **Setup bank account**:
   ```javascript
   const bankAccount = await addBankAccount({
     brandId: 'brand-uuid',
     accountName: 'Restaurant LLC',
     accountNumber: '1234567890',
     bankName: 'Chase Bank',
     isDefault: true
   });
   ```

5. **Request payout**:
   ```javascript
   const payout = await requestPayout({
     brandId: 'brand-uuid',
     amount: 500,
     method: 'BANK_TRANSFER'
   });
   ```

## 📞 Support

For questions or issues:
- Review the [full documentation](ONLINE_ORDERING_GUIDE.md)
- Check the service implementations for usage examples
- All services have JSDoc comments explaining parameters
