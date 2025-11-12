# Online Ordering & Delivery Integration Guide

## Overview

This system enables restaurants to accept online orders via QR codes or web URLs, process payments through Stripe, and manage earnings through a wallet system with automated or manual payouts.

## Features

### 1. **Online Menu System**
- **QR Code Generation**: Automatic QR code generation for each restaurant/branch
- **Public Menu Access**: Customers can view menu via unique URL slug
- **Customization**: Restaurant branding and settings for menu display
- **Real-time Updates**: Menu changes reflect immediately

### 2. **Shopping Cart & Checkout**
- **Session-based Carts**: Guest users get 24-hour cart persistence
- **Customer Carts**: Logged-in customers have persistent carts
- **Modifiers Support**: Full support for item modifiers and customizations
- **Order Types**: Delivery, Pickup, and Dine-in (via QR scan)

### 3. **Payment Processing**
- **Stripe Integration**: Secure payment processing via Stripe Payment Intents
- **Multiple Payment Methods**: Credit/debit cards, digital wallets
- **Refund Support**: Full and partial refunds
- **Platform Fees**: Automatic platform fee calculation and deduction

### 4. **Restaurant Wallet System**
- **Balance Tracking**: Real-time balance and transaction history
- **Automatic Credits**: Payments automatically credited to restaurant wallet
- **Platform Fee Handling**: Fees automatically deducted from order totals
- **Payout Management**: Request payouts to bank accounts

### 5. **Bank Account Management**
- **Multiple Accounts**: Support for multiple bank accounts per restaurant
- **Verification System**: Admin verification of bank accounts
- **Default Account**: Set primary account for payouts
- **International Support**: SWIFT, IBAN, routing numbers

### 6. **Payout System**
- **Manual Payouts**: Restaurant requests, admin approves
- **Automated Payouts**: Optional auto-payout when balance reaches threshold
- **Stripe Connect**: Integration with Stripe Connect for automated transfers
- **Bank Transfer**: Direct bank transfer support
- **Payout History**: Complete audit trail

## Architecture

### Database Models

#### OnlineMenu
- Stores menu configuration and QR codes
- Links to brand/branch
- Customizable settings

#### Cart & CartItem
- Session-based or customer-linked carts
- Auto-expire after 24 hours
- Supports modifiers and notes

#### OnlineOrder
- Complete order snapshot with items
- Payment status tracking
- Order status workflow
- Customer information

#### RestaurantWallet
- Balance management
- Platform fee tracking
- Payout configuration

#### WalletTransaction
- Complete transaction history
- Links to orders and payouts
- Balance snapshots

#### BankAccount
- Multiple accounts per wallet
- Verification status
- International bank details

#### Payout
- Payout requests and history
- Status tracking
- Failure handling

## Workflows

### 1. Restaurant Setup Flow

```
1. Restaurant enables online ordering
2. System creates OnlineMenu with unique URL and QR code
3. Restaurant configures menu settings (optional)
4. Restaurant downloads QR code for printing
5. Restaurant adds bank account for payouts
6. System creates RestaurantWallet
```

### 2. Customer Order Flow

```
1. Customer scans QR code or visits menu URL
2. System displays public menu
3. Customer adds items to cart (session created)
4. Customer proceeds to checkout
5. System creates OnlineOrder from cart
6. Customer enters delivery/contact details
7. System creates Stripe Payment Intent
8. Customer completes payment
9. Stripe webhook confirms payment
10. System credits restaurant wallet (minus platform fee)
11. Order marked as CONFIRMED
12. Restaurant receives order notification
```

### 3. Payout Flow

```
1. Restaurant checks wallet balance
2. Restaurant requests payout to bank account
3. System validates:
   - Sufficient balance
   - Minimum payout amount
   - Bank account exists and verified
4. Payout marked as PENDING
5. Admin reviews payout (optional)
6. System processes payout:
   - Debits wallet
   - Creates transfer (Stripe Connect or manual)
   - Records transaction
7. Payout marked as COMPLETED
```

## Payment Flow Details

### Order Payment
```
Customer Payment: $100.00
Platform Fee (3% + $0.30): $3.30
Restaurant Receives: $96.70

Wallet Transactions:
1. CREDIT: +$96.70 (Payment for order)
2. FEE: -$3.30 (Platform fee)

Final Wallet Balance: +$96.70
```

### Refund Flow
```
Original Order: $100.00
Restaurant Received: $96.70

Refund Requested: $100.00
- Refund customer: $100.00
- Debit restaurant: $100.00 (full amount)

Restaurant loses: $3.30 (platform fee not refunded)
```

## API Endpoints Structure

### Online Menu Management
- `POST /api/online-menu/create` - Create online menu
- `GET /api/online-menu/:brandId` - Get brand's online menu
- `GET /api/online-menu/public/:urlSlug` - Get public menu
- `PATCH /api/online-menu/:menuId/settings` - Update menu settings
- `POST /api/online-menu/:menuId/regenerate-qr` - Regenerate QR code

### Cart Management
- `GET /api/cart/:sessionId` - Get cart
- `POST /api/cart/add` - Add item to cart
- `PATCH /api/cart/item/:itemId` - Update cart item quantity
- `DELETE /api/cart/item/:itemId` - Remove item from cart
- `DELETE /api/cart/:cartId/clear` - Clear cart

### Checkout & Orders
- `POST /api/online-orders/checkout` - Create order from cart
- `POST /api/online-orders/:orderId/payment-intent` - Create payment intent
- `GET /api/online-orders/:orderId` - Get order details
- `GET /api/online-orders/number/:orderNumber` - Get order by number
- `PATCH /api/online-orders/:orderId/status` - Update order status
- `POST /api/online-orders/:orderId/refund` - Process refund
- `GET /api/online-orders` - List orders (brand/branch)

### Wallet Management
- `GET /api/wallet/summary` - Get wallet balance and summary
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/payout/request` - Request payout
- `GET /api/wallet/payouts` - Get payout history
- `POST /api/wallet/payout/:payoutId/cancel` - Cancel payout
- `POST /api/wallet/payout/:payoutId/process` - Process payout (admin)

### Bank Account Management
- `POST /api/wallet/bank-accounts` - Add bank account
- `GET /api/wallet/bank-accounts` - List bank accounts
- `GET /api/wallet/bank-accounts/:id` - Get bank account details
- `PATCH /api/wallet/bank-accounts/:id` - Update bank account
- `POST /api/wallet/bank-accounts/:id/set-default` - Set as default
- `DELETE /api/wallet/bank-accounts/:id` - Delete bank account
- `POST /api/wallet/bank-accounts/:id/verify` - Verify account (admin)

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler
  - `payment_intent.succeeded` → Credit wallet
  - `payment_intent.payment_failed` → Mark order failed
  - `charge.refunded` → Process refund

## Configuration

### Environment Variables
```env
# Online Ordering
ONLINE_MENU_BASE_URL=https://order.truetab.com
PLATFORM_FEE_PERCENT=3
PLATFORM_FEE_FIXED=0.30

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Wallet
MIN_PAYOUT_AMOUNT=100
AUTO_PAYOUT_ENABLED=false
AUTO_PAYOUT_THRESHOLD=1000
```

### Database Migration
```bash
# Generate Prisma client with new models
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or create and run migration
npx prisma migrate dev --name add_online_ordering
```

## Security Considerations

### 1. **Payment Security**
- PCI DSS compliant through Stripe
- Payment Intent for secure payment flow
- Webhook signature verification

### 2. **Data Protection**
- Bank account details encrypted at rest
- Sensitive data masked in logs
- Secure payout processing

### 3. **Access Control**
- Brand/branch isolation
- Role-based access for payouts
- Admin verification for sensitive operations

### 4. **Fraud Prevention**
- Minimum payout amounts
- Payout frequency limits
- Bank account verification
- Transaction audit trail

## Testing

### Test Payment Flow
```javascript
// 1. Create test menu
const menu = await createOnlineMenu({
  brandId: 'test-brand-id',
  settings: { theme: 'modern' }
});

// 2. Add items to cart
const cart = await addToCart({
  cartId: 'test-cart-id',
  itemId: 'item-id',
  variantId: 'variant-id',
  quantity: 2
});

// 3. Checkout
const order = await createOrderFromCart({
  cartId: cart.id,
  customerName: 'Test Customer',
  customerPhone: '+1234567890',
  orderType: 'DELIVERY'
});

// 4. Create payment intent
const { clientSecret } = await createPaymentIntent(order.id);

// 5. Test with Stripe test cards
// 4242 4242 4242 4242 - Success
// 4000 0000 0000 9995 - Insufficient funds
```

### Test Payout Flow
```javascript
// 1. Credit wallet manually (for testing)
await creditWallet({
  brandId: 'test-brand-id',
  amount: 500,
  description: 'Test credit'
});

// 2. Add bank account
const bankAccount = await addBankAccount({
  brandId: 'test-brand-id',
  accountName: 'Test Restaurant',
  accountNumber: '1234567890',
  bankName: 'Test Bank',
  isDefault: true
});

// 3. Request payout
const payout = await requestPayout({
  brandId: 'test-brand-id',
  amount: 200,
  method: 'BANK_TRANSFER'
});

// 4. Process payout (admin)
await processPayout(payout.id);
```

## Monitoring & Analytics

### Key Metrics to Track
- **Order Volume**: Total online orders per day/week/month
- **Average Order Value**: Average ticket size for online orders
- **Payment Success Rate**: Successful vs failed payments
- **Wallet Balance**: Current balance across all restaurants
- **Payout Frequency**: Average time between payouts
- **Platform Fees**: Total fees collected
- **Refund Rate**: Percentage of orders refunded

### Dashboard Queries
```sql
-- Daily order summary
SELECT DATE(created_at) as date, 
       COUNT(*) as orders, 
       SUM(total) as revenue
FROM online_orders
WHERE payment_status = 'SUCCEEDED'
GROUP BY DATE(created_at);

-- Wallet balances
SELECT b.name, rw.balance, rw.total_earned, rw.total_withdrawn
FROM restaurant_wallets rw
JOIN brands b ON b.id = rw.brand_id;

-- Pending payouts
SELECT COUNT(*), SUM(amount)
FROM payouts
WHERE status = 'PENDING';
```

## Future Enhancements

1. **Delivery Integration**
   - Third-party delivery service APIs
   - Real-time order tracking
   - Driver assignment

2. **Advanced Features**
   - Scheduled orders
   - Subscription/recurring orders
   - Gift cards and vouchers
   - Loyalty points redemption

3. **Payment Options**
   - PayPal integration
   - Buy now, pay later (Klarna, Afterpay)
   - Cryptocurrency payments

4. **Wallet Enhancements**
   - Multi-currency support
   - Automated dispute handling
   - Tax document generation
   - Financial reporting

5. **Analytics**
   - Customer behavior tracking
   - Menu item performance
   - Revenue forecasting
   - Churn analysis

## Support & Troubleshooting

### Common Issues

**Issue**: QR code not generating
- Check if ONLINE_MENU_BASE_URL is set
- Verify QRCode package is installed
- Check cloudinary configuration if using cloud storage

**Issue**: Payment failing
- Verify STRIPE_SECRET_KEY is correct
- Check Stripe webhook is configured
- Ensure webhook secret matches

**Issue**: Payout stuck in pending
- Check bank account verification status
- Verify wallet has sufficient balance
- Review payout processing logs

**Issue**: Wallet balance mismatch
- Run transaction audit query
- Check for failed transactions
- Verify platform fee calculations

## Contact

For issues or questions:
- Development Team: dev@truetab.com
- API Documentation: https://api.truetab.com/docs
- Support: support@truetab.com
