# Unified Order Model - Migration Guide

## Overview

Instead of having a separate `OnlineOrder` table, we've **unified all orders** (dine-in, takeaway, delivery, and online) into the existing `Order` model. This simplifies the system architecture and makes it easier to manage all orders in one place.

## What Changed

### 1. **Enhanced Order Model**

The `Order` model now includes fields for online ordering:

```prisma
model Order {
  // Existing fields...
  
  // NEW: Online ordering fields
  orderNumber         String?           @unique     // For customer lookup
  isOnlineOrder       Boolean           @default(false)
  customerName        String?           // For guest customers
  customerEmail       String?
  customerPhone       String?
  deliveryAddress     Json?             // Full address object
  deliveryFee         Decimal           @default(0)
  paymentStatus       PaymentStatus?    @default(PENDING)
  paymentIntentId     String?           @unique    // Stripe payment
  paymentMethod       String?           // stripe, paystack, etc.
  transactionId       String?
  paidAt              DateTime?
  specialInstructions String?
  estimatedTime       Int?              // Minutes
  scheduledFor        DateTime?         // Scheduled orders
  completedAt         DateTime?
  canceledAt          DateTime?
  cancelReason        String?
  
  // Existing relations...
  walletTransactions  WalletTransaction[]
}
```

### 2. **Updated OrderStatus Enum**

Added new statuses to support online ordering workflow:

```prisma
enum OrderStatus {
  DRAFT                 // Existing
  OPEN                  // Existing
  CONFIRMED             // NEW - Order confirmed after payment
  IN_PROGRESS           // Existing
  PREPARING             // NEW - Being prepared
  READY                 // Existing
  OUT_FOR_DELIVERY      // NEW - Out for delivery
  DELIVERED             // NEW - Successfully delivered
  SERVED                // Existing (for dine-in)
  PART_PAID             // Existing
  PAID                  // Existing
  COMPLETED             // NEW - Order completed
  CANCELLED             // Existing
  REFUNDED              // Existing
}
```

### 3. **Removed Models**

- ❌ `OnlineOrder` - No longer needed
- ❌ `OnlineOrderType` enum - Use existing `OrderType`
- ❌ `OnlineOrderStatus` enum - Use enhanced `OrderStatus`

### 4. **Updated Relations**

```prisma
// WalletTransaction now references Order instead of OnlineOrder
model WalletTransaction {
  orderId   String?
  order     Order?  @relation(fields: [orderId], references: [id])
  // Instead of:
  // onlineOrderId   String?
  // onlineOrder     OnlineOrder?
}
```

## Benefits of Unified Model

### 1. **Single Source of Truth**
- All orders in one table
- Easier to query and report on
- Consistent order management

### 2. **Simplified Architecture**
- No need to maintain two separate order systems
- Shared order items, payments, taxes
- Reuse existing kitchen ticket system

### 3. **Better Integration**
- Online orders appear in POS system
- Staff can manage all orders from one interface
- Unified order history for customers

### 4. **Flexible Order Types**
```javascript
// Dine-in order
{
  type: 'DINE_IN',
  isOnlineOrder: false,
  tableId: 'table-123',
  waiterId: 'waiter-456'
}

// Online delivery order
{
  type: 'DELIVERY',
  isOnlineOrder: true,
  orderNumber: 'OL-1234567890-ABC123',
  customerName: 'John Doe',
  customerPhone: '+1234567890',
  deliveryAddress: { ... },
  paymentStatus: 'SUCCEEDED'
}

// Online pickup order
{
  type: 'TAKEAWAY',
  isOnlineOrder: true,
  orderNumber: 'OL-1234567890-XYZ789',
  scheduledFor: '2025-11-12T18:00:00Z'
}
```

## Usage Examples

### Creating an Online Order

```javascript
const order = await prisma.order.create({
  data: {
    orderNumber: `OL-${Date.now()}-${nanoid(6)}`,
    brandId: 'brand-id',
    branchId: 'branch-id',
    type: 'DELIVERY',
    isOnlineOrder: true,
    status: 'DRAFT',
    customerName: 'John Doe',
    customerPhone: '+1234567890',
    customerEmail: 'john@example.com',
    deliveryAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    },
    subtotal: 45.00,
    tax: 4.50,
    deliveryFee: 5.00,
    total: 54.50,
    paymentMethod: 'stripe',
    paymentStatus: 'PENDING',
    items: {
      create: [
        {
          itemId: 'item-id',
          variantId: 'variant-id',
          quantity: 2,
          basePrice: 22.50,
          linePrice: 45.00
        }
      ]
    }
  }
});
```

### Querying Online Orders

```javascript
// Get all online orders
const onlineOrders = await prisma.order.findMany({
  where: {
    isOnlineOrder: true,
    brandId: 'brand-id'
  }
});

// Get online orders by type
const deliveryOrders = await prisma.order.findMany({
  where: {
    isOnlineOrder: true,
    type: 'DELIVERY',
    status: { in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'] }
  }
});

// Get orders by customer phone (including both dine-in and online)
const customerOrders = await prisma.order.findMany({
  where: {
    OR: [
      { customerId: 'customer-id' },
      { customerPhone: '+1234567890' }
    ]
  }
});
```

### Filtering In POS vs Online

```javascript
// POS orders only
const posOrders = await prisma.order.findMany({
  where: {
    isOnlineOrder: false,
    brandId: 'brand-id'
  }
});

// Online orders only
const onlineOrders = await prisma.order.findMany({
  where: {
    isOnlineOrder: true,
    brandId: 'brand-id'
  }
});

// All orders
const allOrders = await prisma.order.findMany({
  where: {
    brandId: 'brand-id'
  }
});
```

## Migration Steps

### 1. **Update Database Schema**

```bash
# Generate Prisma client with changes
npx prisma generate

# Apply schema changes
npx prisma db push

# Or create migration
npx prisma migrate dev --name unified_order_model
```

### 2. **Service Layer Already Updated** ✅

The following services have been updated:
- ✅ `checkout.service.js` - Uses unified `Order` model
- ✅ `wallet.service.js` - References `orderId` instead of `onlineOrderId`
- ✅ Cart and menu services - No changes needed

### 3. **Update Queries in Your Code**

Replace any references to `onlineOrder` with `order`:

```javascript
// Before
walletTransaction.onlineOrder?.orderNumber

// After
walletTransaction.order?.orderNumber
```

### 4. **Update Webhook Handlers**

Ensure Stripe webhook handlers use the unified model:

```javascript
case 'payment_intent.succeeded':
  const order = await prisma.order.findFirst({
    where: { paymentIntentId: paymentIntent.id }
  });
  // Process order...
  break;
```

## Key Fields Explanation

### `isOnlineOrder` (Boolean)
- `true` = Order came from online ordering system
- `false` = Order created in POS by staff

### `orderNumber` (String?)
- Unique customer-facing order number (e.g., "OL-1234567890-ABC123")
- Only set for online orders
- Used for customer order tracking

### `createdById` (String?)
- Required for POS orders (staff member who created it)
- **Optional** for online orders (set to `null`)
- Allows system-created orders

### `customerName` vs `customerId`
- `customerId`: Link to registered customer account
- `customerName`: For guest checkouts (no account)
- Can have both for registered customers

### `paymentStatus` (PaymentStatus?)
- Tracks online payment status separately from order status
- Only used for online orders
- Null for POS orders (use existing payment flow)

## Querying Patterns

### Dashboard Metrics

```javascript
// Total orders today (all types)
const totalOrders = await prisma.order.count({
  where: {
    brandId: 'brand-id',
    createdAt: { gte: startOfDay }
  }
});

// Online orders revenue
const onlineRevenue = await prisma.order.aggregate({
  where: {
    brandId: 'brand-id',
    isOnlineOrder: true,
    paymentStatus: 'SUCCEEDED'
  },
  _sum: { total: true }
});

// Orders by type
const ordersByType = await prisma.order.groupBy({
  by: ['type'],
  where: { brandId: 'brand-id' },
  _count: true
});
```

### Kitchen Display

```javascript
// All pending orders (both POS and online)
const pendingOrders = await prisma.order.findMany({
  where: {
    branchId: 'branch-id',
    status: { in: ['OPEN', 'CONFIRMED', 'IN_PROGRESS', 'PREPARING'] }
  },
  include: {
    items: { include: { item: true, modifiers: true } },
    table: true  // Will be null for online orders
  },
  orderBy: { createdAt: 'asc' }
});
```

## Status Workflow

### POS Order Workflow
```
DRAFT → OPEN → IN_PROGRESS → READY → SERVED → PAID → COMPLETED
```

### Online Delivery Order Workflow
```
DRAFT → (payment) → CONFIRMED → PREPARING → READY → 
OUT_FOR_DELIVERY → DELIVERED → COMPLETED
```

### Online Pickup Order Workflow
```
DRAFT → (payment) → CONFIRMED → PREPARING → READY → 
COMPLETED (when customer picks up)
```

## Backward Compatibility

If you have existing code that references `OnlineOrder`:

1. **Search and replace** `onlineOrder` → `order`
2. **Add filter** `where: { isOnlineOrder: true }` when querying only online orders
3. **Update relations** Change `onlineOrderId` → `orderId`

## Testing

```javascript
// Test creating online order
const onlineOrder = await prisma.order.create({
  data: {
    orderNumber: 'TEST-001',
    isOnlineOrder: true,
    type: 'DELIVERY',
    status: 'DRAFT',
    brandId: 'test-brand',
    branchId: 'test-branch',
    customerName: 'Test User',
    customerPhone: '+1234567890',
    subtotal: 100,
    total: 100,
    paymentStatus: 'PENDING'
  }
});

// Test wallet transaction
const transaction = await prisma.walletTransaction.create({
  data: {
    walletId: 'wallet-id',
    orderId: onlineOrder.id,  // ✓ Works with unified model
    type: 'CREDIT',
    amount: 100,
    balanceBefore: 0,
    balanceAfter: 100,
    description: 'Test payment'
  }
});

// Query with relation
const txWithOrder = await prisma.walletTransaction.findUnique({
  where: { id: transaction.id },
  include: {
    order: true  // ✓ Gets the order
  }
});
```

## Summary

✅ **Single unified Order model** for all order types  
✅ **Cleaner architecture** with less duplication  
✅ **Better integration** between POS and online ordering  
✅ **Flexible querying** with `isOnlineOrder` flag  
✅ **Services already updated** to use unified model  
✅ **Enhanced status workflow** supports all order types  

The unified model makes it much easier to build features that span both POS and online ordering, like customer order history, analytics, and reporting!
