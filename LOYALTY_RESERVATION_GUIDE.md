# Loyalty & Reservation Features Guide

This guide covers the newly added Loyalty Program and Reservation Management features for the TrueTab API.

## Table of Contents
- [Loyalty Program](#loyalty-program)
- [Reservations](#reservations)
- [API Endpoints](#api-endpoints)

---

## Loyalty Program

The loyalty program allows brands to reward their customers with points that can be redeemed for rewards.

### Features

1. **Loyalty Programs**: Create and manage brand-specific loyalty programs
2. **Loyalty Tiers**: Define multiple tiers (Bronze, Silver, Gold, etc.) with different benefits
3. **Customer Enrollment**: Automatically or manually enroll customers
4. **Points System**: Earn points on purchases, redeem for rewards
5. **Rewards Catalog**: Create various reward types (discounts, free items, vouchers)
6. **Transaction History**: Track all point earnings and redemptions

### Database Models

#### LoyaltyProgram
- `pointsPerCurrency`: How many points earned per currency unit spent
- `currencyPerPoint`: Value of each point when redeemed
- `minRedemptionPoints`: Minimum points required to redeem
- `expiryDays`: Optional point expiration period

#### LoyaltyTier
- `minPoints`: Minimum points required for this tier
- `multiplier`: Points multiplier for this tier (e.g., 1.5x)
- `benefits`: JSON object storing tier benefits

#### CustomerLoyalty
- `points`: Current available points
- `lifetimePoints`: Total points earned ever
- `lifetimeSpent`: Total amount spent
- `tierId`: Current tier

#### LoyaltyTransaction
- Types: `EARNED`, `REDEEMED`, `EXPIRED`, `ADJUSTED`, `BONUS`
- Tracks all point movements

#### LoyaltyReward
- Types: `DISCOUNT_PERCENT`, `DISCOUNT_AMOUNT`, `FREE_ITEM`, `VOUCHER`
- `pointsCost`: Points required to redeem
- `rewardValue`: Monetary value or percentage

---

## Reservations

Full-featured reservation management system for table bookings.

### Features

1. **Table Reservations**: Book tables for specific times
2. **Customer Management**: Link reservations to customers or create walk-in reservations
3. **Availability Checking**: Automatically check table availability
4. **Status Management**: Track reservation lifecycle (PENDING → CONFIRMED → SEATED)
5. **Conflict Prevention**: Prevent double-bookings
6. **Today's View**: Quick access to today's reservations

### Reservation Lifecycle

1. **PENDING**: Initial reservation state
2. **CONFIRMED**: Restaurant has confirmed the reservation
3. **SEATED**: Customer has arrived and been seated
4. **CANCELLED**: Reservation was cancelled
5. **NO_SHOW**: Customer didn't show up

---

## API Endpoints

### Loyalty Program

#### Programs

**Create Loyalty Program**
```
POST /api/loyalty/programs
Authorization: Bearer {token}
X-Brand-ID: {brandId}

{
  "name": "Gold Rewards",
  "description": "Earn 1 point per dollar spent",
  "pointsPerCurrency": 1,
  "currencyPerPoint": 0.01,
  "minRedemptionPoints": 100,
  "expiryDays": 365,
  "isActive": true
}
```

**List Loyalty Programs**
```
GET /api/loyalty/programs?limit=20&offset=0
```

**Get Program Details**
```
GET /api/loyalty/programs/:id
```

**Update Program**
```
PATCH /api/loyalty/programs/:id
{
  "pointsPerCurrency": 1.5,
  "isActive": true
}
```

**Delete Program**
```
DELETE /api/loyalty/programs/:id
```

#### Tiers

**Create Tier**
```
POST /api/loyalty/programs/:id/tiers
{
  "programId": "uuid",
  "name": "Gold",
  "minPoints": 1000,
  "multiplier": 1.5,
  "benefits": {
    "priority_seating": true,
    "free_dessert": true
  },
  "color": "#FFD700",
  "sortOrder": 2
}
```

**Update Tier**
```
PATCH /api/loyalty/programs/:id/tiers/:tierId
```

**Delete Tier**
```
DELETE /api/loyalty/programs/:id/tiers/:tierId
```

#### Customer Loyalty

**Enroll Customer**
```
POST /api/loyalty/enroll
{
  "customerId": "uuid",
  "programId": "uuid"
}
```

**Get Customer Loyalty Account**
```
GET /api/loyalty/customers/:customerId
```

**Get Customer Transaction History**
```
GET /api/loyalty/customers/:customerId/transactions?limit=20&offset=0
```

#### Points Transactions

**Earn Points**
```
POST /api/loyalty/programs/:id/earn
{
  "customerId": "uuid",
  "orderId": "uuid",  // optional
  "points": 50,
  "description": "Purchase at Main Street location"
}
```

**Redeem Points**
```
POST /api/loyalty/programs/:id/redeem
{
  "customerId": "uuid",
  "rewardId": "uuid",  // optional
  "points": 100,
  "description": "Redeemed for 10% discount"
}
```

**Adjust Points (Admin Only)**
```
POST /api/loyalty/programs/:id/customers/:customerId/adjust
{
  "points": -50,  // negative to deduct, positive to add
  "description": "Correction for refunded order"
}
```

#### Rewards

**Create Reward**
```
POST /api/loyalty/programs/:id/rewards
{
  "programId": "uuid",
  "name": "10% Off Next Order",
  "description": "Get 10% off your next order",
  "pointsCost": 200,
  "rewardType": "DISCOUNT_PERCENT",
  "rewardValue": 10,
  "isActive": true,
  "maxRedemptions": 1000,
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

**List Rewards**
```
GET /api/loyalty/programs/:id/rewards?isActive=true&limit=20
```

**Update Reward**
```
PATCH /api/loyalty/programs/:id/rewards/:rewardId
```

**Delete Reward**
```
DELETE /api/loyalty/programs/:id/rewards/:rewardId
```

---

### Reservations

**Create Reservation**
```
POST /api/reservations
Authorization: Bearer {token}
X-Brand-ID: {brandId}

{
  "branchId": "uuid",
  "tableId": "uuid",  // optional
  "customerId": "uuid",  // optional
  "customerName": "John Doe",  // required if no customerId
  "customerPhone": "+1234567890",
  "customerEmail": "john@example.com",
  "covers": 4,
  "reservedAt": "2024-12-25T19:00:00Z",
  "duration": 120,  // minutes, default 120
  "notes": "Anniversary dinner, window seat preferred",
  "status": "PENDING"
}
```

**List Reservations**
```
GET /api/reservations?branchId=uuid&startDate=2024-12-25&endDate=2024-12-26&status=CONFIRMED&limit=20&offset=0
```

**Get Reservation**
```
GET /api/reservations/:id
```

**Update Reservation**
```
PATCH /api/reservations/:id
{
  "tableId": "new-uuid",
  "covers": 6,
  "reservedAt": "2024-12-25T20:00:00Z",
  "status": "CONFIRMED",
  "notes": "Updated party size"
}
```

**Cancel Reservation**
```
POST /api/reservations/:id/cancel
```

**Check Table Availability**
```
GET /api/reservations/availability?branchId=uuid&reservedAt=2024-12-25T19:00:00Z&covers=4&duration=120
```

**Get Today's Reservations**
```
GET /api/reservations/today?branchId=uuid
```

---

## Integration Examples

### Earning Points on Order Completion

```javascript
// After order is paid
const orderTotal = 125.50;
const loyaltyProgram = await getLoyaltyProgramById(brandId);

if (order.customerId && loyaltyProgram) {
  const pointsToEarn = Math.floor(
    orderTotal * loyaltyProgram.pointsPerCurrency
  );
  
  await earnPoints({
    customerId: order.customerId,
    programId: loyaltyProgram.id,
    orderId: order.id,
    points: pointsToEarn,
    description: `Order #${order.id}`,
  });
}
```

### Auto-Updating Table Status on Reservation

```javascript
// When reservation status changes to SEATED
if (reservation.status === 'SEATED' && reservation.tableId) {
  await updateTableStatus(reservation.tableId, 'OCCUPIED');
}

// When reservation is completed or cancelled
if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(reservation.status)) {
  await updateTableStatus(reservation.tableId, 'AVAILABLE');
}
```

### Customer Auto-Creation on Reservation

The reservation system automatically creates a customer record if phone/email is provided but no customerId exists. It also searches for existing customers to avoid duplicates.

---

## Authorization

All endpoints require:
- `Authorization: Bearer {jwt_token}` header
- `X-Brand-ID: {brandId}` header
- Active subscription

Admin-only endpoints (marked with ⚠️) additionally require:
- Role: `SUPER_ADMIN`, `BRAND_OWNER`, `BRAND_ADMIN`, or `BRANCH_MANAGER`

---

## Best Practices

### Loyalty Programs

1. **Start Simple**: Begin with a single program and tier structure
2. **Clear Communication**: Make point values and rewards easy to understand
3. **Regular Rewards**: Offer low-cost rewards to keep customers engaged
4. **Tier Benefits**: Make tier progression meaningful and visible
5. **Point Expiry**: Use expiry strategically to encourage repeat visits

### Reservations

1. **Confirmation**: Always confirm reservations to reduce no-shows
2. **Buffer Time**: Include buffer time between reservations (built into availability check)
3. **Reminders**: Send reminders 24 hours and 2 hours before reservation
4. **Flexible Tables**: Allow table reassignment for operational flexibility
5. **No-Show Policy**: Track and manage no-shows appropriately

---

## Database Schema

See `prisma/schema.prisma` for complete schema definitions.

Key relationships:
- `Brand` → `LoyaltyProgram` (one-to-many)
- `LoyaltyProgram` → `LoyaltyTier` (one-to-many)
- `Customer` → `CustomerLoyalty` (one-to-one)
- `CustomerLoyalty` → `LoyaltyTransaction` (one-to-many)
- `Customer` → `Reservation` (one-to-many)
- `Table` → `Reservation` (one-to-many)

---

## Migration

The database migration has been applied:
```
20251112152323_add_loyalty_and_enhance_reservations
```

Generated tables:
- `loyalty_programs`
- `loyalty_tiers`
- `customer_loyalty`
- `loyalty_transactions`
- `loyalty_rewards`

Reservation table already existed and received new foreign key constraints.

---

## Support

For questions or issues:
1. Check the API documentation: `/api-docs`
2. Review test examples in `/tests`
3. Contact development team

---

**Last Updated**: November 12, 2024
**Version**: 1.0.0
