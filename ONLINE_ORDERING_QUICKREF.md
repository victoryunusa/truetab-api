# Online Ordering & Wallet - Quick Reference

## 🚀 Quick Setup

```bash
# 1. Update database schema
npx prisma generate && npx prisma db push

# 2. Add environment variables
echo "ONLINE_MENU_BASE_URL=https://order.truetab.com" >> .env
echo "PLATFORM_FEE_PERCENT=3" >> .env
echo "PLATFORM_FEE_FIXED=0.30" >> .env
```

## 📋 Service Functions Cheatsheet

### Online Menu
```javascript
const menuService = require('./src/modules/online-ordering/menu.service');

// Create menu with QR
await menuService.createOnlineMenu({ brandId, settings: {} });

// Get public menu (no auth)
await menuService.getPublicMenu(urlSlug);

// Get brand's menu
await menuService.getBrandOnlineMenu(brandId);
```

### Cart
```javascript
const cartService = require('./src/modules/online-ordering/cart.service');

// Get/create cart
await cartService.getOrCreateCart({ sessionId, brandId });

// Add item
await cartService.addToCart({ cartId, itemId, variantId, quantity });

// Update quantity
await cartService.updateCartItem(cartItemId, quantity);

// Remove item
await cartService.removeFromCart(cartItemId);

// Get cart with totals
await cartService.getCart(cartId);
```

### Checkout
```javascript
const checkoutService = require('./src/modules/online-ordering/checkout.service');

// Create order
const order = await checkoutService.createOrderFromCart({
  cartId,
  customerName,
  customerPhone,
  orderType: 'DELIVERY'
});

// Create payment
const { clientSecret } = await checkoutService.createPaymentIntent(order.id);

// Handle webhook
await checkoutService.handlePaymentSuccess(paymentIntentId);

// Refund
await checkoutService.processRefund(orderId, amount);

// Update status
await checkoutService.updateOrderStatus(orderId, 'PREPARING');

// Get orders
await checkoutService.getOrders({ brandId, status: 'CONFIRMED' });
```

### Wallet
```javascript
const walletService = require('./src/modules/wallet/wallet.service');

// Get summary
const summary = await walletService.getWalletSummary(brandId);
// Returns: { balance, availableBalance, pendingPayouts }

// Get transactions
await walletService.getTransactionHistory({ brandId, limit: 50 });

// Request payout
await walletService.requestPayout({
  brandId,
  amount: 500,
  method: 'BANK_TRANSFER'
});

// Process payout (admin)
await walletService.processPayout(payoutId);

// Get payouts
await walletService.getPayouts({ brandId, status: 'PENDING' });
```

### Bank Accounts
```javascript
const bankService = require('./src/modules/wallet/bank-account.service');

// Add account
await bankService.addBankAccount({
  brandId,
  accountName,
  accountNumber,
  bankName,
  isDefault: true
});

// Get accounts
await bankService.getBankAccounts(brandId);

// Set default
await bankService.setDefaultBankAccount(accountId);

// Verify (admin)
await bankService.verifyBankAccount(accountId, true);
```

## 🔄 Common Workflows

### Setup Restaurant Online Ordering
```javascript
// 1. Create online menu
const menu = await menuService.createOnlineMenu({ 
  brandId: 'brand-id'
});
// Save menu.qrCode (base64 image) for printing
// Share menu.menuUrl with customers

// 2. Add bank account
await bankService.addBankAccount({
  brandId: 'brand-id',
  accountName: 'Restaurant LLC',
  accountNumber: '1234567890',
  bankName: 'Chase',
  isDefault: true
});
```

### Process Customer Order
```javascript
// 1. Customer adds items to cart
const cart = await cartService.getOrCreateCart({ 
  sessionId: 'session-123', 
  brandId 
});
await cartService.addToCart({ 
  cartId: cart.id, 
  itemId: 'item-id', 
  quantity: 2 
});

// 2. Checkout
const order = await checkoutService.createOrderFromCart({
  cartId: cart.id,
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  orderType: 'DELIVERY'
});

// 3. Create payment
const { clientSecret } = await checkoutService.createPaymentIntent(order.id);
// Send clientSecret to frontend for Stripe Elements

// 4. Webhook handles success automatically
// → Credits wallet
// → Deducts platform fee
// → Marks order CONFIRMED
```

### Request Payout
```javascript
// 1. Check balance
const summary = await walletService.getWalletSummary(brandId);
console.log(`Available: $${summary.availableBalance}`);

// 2. Request payout
const payout = await walletService.requestPayout({
  brandId,
  amount: 500,
  method: 'BANK_TRANSFER'
});
// Status: PENDING

// 3. Admin processes (or automated)
await walletService.processPayout(payout.id);
// Status: COMPLETED
// Wallet debited, bank transfer initiated
```

## 💾 Database Queries

### Check Wallet Balance
```sql
SELECT 
  b.name as restaurant,
  rw.balance,
  rw.total_earned,
  rw.total_withdrawn,
  rw.balance - COALESCE(
    (SELECT SUM(amount) FROM payouts 
     WHERE wallet_id = rw.id AND status IN ('PENDING', 'PROCESSING')), 
    0
  ) as available_balance
FROM restaurant_wallets rw
JOIN brands b ON b.id = rw.brand_id;
```

### Today's Orders
```sql
SELECT 
  order_number,
  customer_name,
  total,
  status,
  payment_status,
  created_at
FROM online_orders
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Pending Payouts
```sql
SELECT 
  b.name as restaurant,
  p.amount,
  p.status,
  p.requested_at,
  ba.bank_name,
  ba.account_number
FROM payouts p
JOIN restaurant_wallets rw ON rw.id = p.wallet_id
JOIN brands b ON b.id = rw.brand_id
LEFT JOIN bank_accounts ba ON ba.id = p.bank_account_id
WHERE p.status = 'PENDING'
ORDER BY p.requested_at;
```

### Transaction History
```sql
SELECT 
  type,
  amount,
  description,
  balance_after,
  created_at,
  oo.order_number
FROM wallet_transactions wt
LEFT JOIN online_orders oo ON oo.id = wt.online_order_id
WHERE wt.wallet_id = 'wallet-id'
ORDER BY wt.created_at DESC
LIMIT 50;
```

## 🧪 Testing

### Stripe Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
3D Secure required: 4000 0027 6000 3184
```

### Test Flow
```javascript
// Complete test flow
const testOrder = async () => {
  // 1. Create menu
  const menu = await menuService.createOnlineMenu({ brandId: 'test-brand' });
  
  // 2. Add to cart
  const cart = await cartService.getOrCreateCart({ sessionId: 'test', brandId: 'test-brand' });
  await cartService.addToCart({ cartId: cart.id, itemId: 'test-item', quantity: 1 });
  
  // 3. Checkout
  const order = await checkoutService.createOrderFromCart({
    cartId: cart.id,
    customerName: 'Test User',
    customerPhone: '+1234567890'
  });
  
  // 4. Payment
  const { clientSecret } = await checkoutService.createPaymentIntent(order.id);
  
  // 5. Simulate webhook
  await checkoutService.handlePaymentSuccess(order.paymentIntentId);
  
  // 6. Check wallet
  const wallet = await walletService.getWalletSummary('test-brand');
  console.log('Wallet balance:', wallet.balance);
};
```

## 📊 Key Metrics

```javascript
// Daily revenue
const dailyRevenue = await prisma.onlineOrder.aggregate({
  where: {
    brandId,
    paymentStatus: 'SUCCEEDED',
    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  },
  _sum: { total: true },
  _count: true
});

// Available balance
const wallet = await walletService.getWalletSummary(brandId);

// Pending orders
const pendingOrders = await prisma.onlineOrder.count({
  where: { brandId, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } }
});
```

## 🔐 Security Checklist

- [ ] STRIPE_WEBHOOK_SECRET configured
- [ ] Webhook signature verification enabled
- [ ] Bank account details encrypted
- [ ] Role-based access for payouts
- [ ] Minimum payout amount set
- [ ] Cart expiry enabled (24h)
- [ ] CORS configured for public menu
- [ ] Rate limiting on payment endpoints

## 📁 File Structure

```
src/
├── modules/
│   ├── online-ordering/
│   │   ├── menu.service.js       ✓ Menu & QR codes
│   │   ├── cart.service.js       ✓ Shopping cart
│   │   └── checkout.service.js   ✓ Orders & payments
│   └── wallet/
│       ├── wallet.service.js     ✓ Balance & payouts
│       └── bank-account.service.js ✓ Bank accounts
└── services/
    └── stripe.service.js          ✓ Stripe integration

prisma/
└── schema.prisma                  ✓ 8 new models added
```

## 🔗 Important Links

- [Full Guide](ONLINE_ORDERING_GUIDE.md) - Complete documentation
- [Implementation Summary](ONLINE_ORDERING_SUMMARY.md) - What's done & next steps
- [Stripe Docs](https://stripe.com/docs/payments/payment-intents) - Payment Intents
- [Stripe Connect](https://stripe.com/docs/connect) - Automated payouts

## ⚡ Performance Tips

1. **Cart cleanup**: Run daily cron to delete expired carts
   ```javascript
   await cartService.cleanupExpiredCarts();
   ```

2. **Index optimization**: Ensure indexes on frequently queried fields
   - `online_orders.brandId`
   - `online_orders.status`
   - `online_orders.paymentStatus`
   - `wallet_transactions.walletId`
   - `payouts.status`

3. **Caching**: Cache public menus for 5-10 minutes

4. **Pagination**: Always use limit/offset for transaction history

## 🆘 Troubleshooting

**Cart items not showing**
- Check cart hasn't expired (24h TTL)
- Verify items are active

**Payment failing**
- Check Stripe keys are correct
- Verify webhook endpoint is reachable
- Test with Stripe test cards

**Payout stuck**
- Verify bank account is verified
- Check wallet has sufficient balance
- Ensure no duplicate payout requests

**Wallet balance incorrect**
- Query wallet_transactions for audit trail
- Check for failed/pending transactions
- Verify platform fee calculations

---

**Need Help?** Check the [full documentation](ONLINE_ORDERING_GUIDE.md) or service source code for detailed usage.
