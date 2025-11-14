# New Features Implementation Guide

This document covers the implementation of four major features:
1. **Reviews & Ratings System**
2. **Gift Cards & Store Credit**
3. **Kitchen Display System Enhancement**
4. **Third-Party Delivery Integration**

## ✅ Database Schema - COMPLETED

All database schemas have been added to `prisma/schema.prisma`:
- Review, ReviewResponse, ReviewMedia models
- GiftCard, GiftCardTransaction, StoreCredit, StoreCreditTransaction models
- Enhanced KitchenTicket with prep time tracking
- DeliveryProvider, DeliveryIntegration, DeliveryOrder models

## 📋 Implementation Status

### 1. Reviews & Ratings System

#### Features
- ✅ Customer can leave reviews (1-5 stars)
- ✅ Separate ratings for food, service, ambiance
- ✅ Photo/video uploads support
- ✅ Brand can respond to reviews
- ✅ Moderation (publish/unpublish, flag)
- ✅ Verified purchase badges
- ✅ Review analytics

#### API Endpoints
```
POST   /api/reviews                    - Create review (Customer)
GET    /api/reviews                    - List reviews (Public)
GET    /api/reviews/:id                - Get review details
PUT    /api/reviews/:id                - Update review (Customer - owner only)
DELETE /api/reviews/:id                - Delete review (Customer/Admin)
POST   /api/reviews/:id/response       - Respond to review (Brand Owner/Admin)
PATCH  /api/reviews/:id/moderate       - Moderate review (Admin)
GET    /api/reviews/stats              - Get review statistics
```

#### Key Files to Create
- `/src/modules/reviews/reviews.validation.js` ✅ CREATED
- `/src/modules/reviews/reviews.service.js`
- `/src/modules/reviews/reviews.controller.js`
- `/src/modules/reviews/reviews.routes.js`

---

### 2. Gift Cards & Store Credit

#### Features
- ✅ Purchase gift cards
- ✅ Send to recipient via email/SMS
- ✅ Check balance
- ✅ Redeem during checkout
- ✅ Store credit for refunds/compensation
- ✅ Transaction history
- ✅ Expiration management

#### API Endpoints
```
POST   /api/gift-cards                 - Purchase gift card
GET    /api/gift-cards                 - List gift cards (Admin)
GET    /api/gift-cards/:code/balance   - Check balance (Public)
POST   /api/gift-cards/:code/redeem    - Redeem gift card
GET    /api/gift-cards/:code/history   - Transaction history

POST   /api/store-credit               - Issue store credit (Admin)
GET    /api/store-credit/customer/:id  - Get customer's store credit
POST   /api/store-credit/apply         - Apply store credit to order
```

#### Key Implementation Points
- Generate unique, secure gift card codes (use nanoid or uuid)
- Validate balance before redemption
- Handle partial redemptions
- Track all transactions for audit trail
- Send email notifications to recipients
- Integrate with payment flow for redemption

#### Key Files to Create
- `/src/modules/gift-cards/gift-cards.validation.js`
- `/src/modules/gift-cards/gift-cards.service.js`
- `/src/modules/gift-cards/gift-cards.controller.js`
- `/src/modules/gift-cards/gift-cards.routes.js`

---

### 3. Kitchen Display System Enhancement

#### Features
- ✅ Real-time ticket updates (WebSocket)
- ✅ Prep time tracking (estimated vs actual)
- ✅ Priority ordering
- ✅ Accept, Start, Ready, Serve workflow
- ✅ Bump functionality
- ✅ Performance metrics (average prep time, on-time rate)
- ✅ Delay tracking with reasons

#### API Endpoints
```
GET    /api/kds/tickets                - List active tickets
GET    /api/kds/tickets/:id            - Get ticket details
PATCH  /api/kds/tickets/:id/accept     - Accept ticket
PATCH  /api/kds/tickets/:id/start      - Start prep
PATCH  /api/kds/tickets/:id/ready      - Mark ready
PATCH  /api/kds/tickets/:id/serve      - Mark served
PATCH  /api/kds/tickets/:id/bump       - Bump ticket
GET    /api/kds/metrics                - Get station performance metrics
GET    /api/kds/metrics/station/:id    - Get specific station metrics
```

#### WebSocket Events
```javascript
// Client subscribes to station
socket.emit('subscribe', { stationId: 'station-uuid' });

// Server sends updates
socket.on('ticket:new', (ticket) => {});
socket.on('ticket:updated', (ticket) => {});
socket.on('ticket:completed', (ticket) => {});
```

#### Key Files to Create/Update
- `/src/modules/kds/kds.service.js`
- `/src/modules/kds/kds.controller.js`
- `/src/modules/kds/kds.routes.js`
- `/src/realtime/kds.socket.js` (WebSocket handling)

---

### 4. Third-Party Delivery Integration

#### Features
- ✅ Connect to Uber Eats, DoorDash, Grubhub
- ✅ Receive orders via webhook
- ✅ Menu synchronization
- ✅ Status updates
- ✅ Driver tracking
- ✅ Commission tracking
- ✅ Unified order management

#### API Endpoints
```
GET    /api/delivery/providers         - List available providers
POST   /api/delivery/integrations      - Connect to provider
GET    /api/delivery/integrations      - List integrations
PUT    /api/delivery/integrations/:id  - Update integration
DELETE /api/delivery/integrations/:id  - Disconnect provider

POST   /api/delivery/webhook/uber-eats - Uber Eats webhook
POST   /api/delivery/webhook/doordash  - DoorDash webhook
POST   /api/delivery/webhook/grubhub   - Grubhub webhook

GET    /api/delivery/orders            - List delivery orders
GET    /api/delivery/orders/:id        - Get delivery order details
PATCH  /api/delivery/orders/:id/status - Update order status
```

#### Provider Integration Flow

1. **Setup Integration**
   ```javascript
   POST /api/delivery/integrations
   {
     "providerId": "uber-eats-provider-id",
     "credentials": {
       "apiKey": "encrypted-key",
       "storeId": "store-id"
     },
     "settings": {
       "autoAccept": false,
       "preparationTime": 15
     }
   }
   ```

2. **Receive Order** (Webhook)
   ```javascript
   // Provider sends webhook
   POST /api/delivery/webhook/uber-eats
   {
     "orderId": "external-order-id",
     "customer": {...},
     "items": [...],
     "total": 45.99
   }
   
   // System creates internal order
   // Links to DeliveryOrder record
   ```

3. **Update Status**
   ```javascript
   PATCH /api/delivery/orders/:id/status
   {
     "status": "PREPARING"
   }
   
   // Syncs status back to provider
   ```

#### Key Files to Create
- `/src/modules/delivery/delivery.validation.js`
- `/src/modules/delivery/delivery.service.js`
- `/src/modules/delivery/delivery.controller.js`
- `/src/modules/delivery/delivery.routes.js`
- `/src/modules/delivery/providers/uber-eats.js`
- `/src/modules/delivery/providers/doordash.js`
- `/src/modules/delivery/webhook.controller.js`

---

## 🚀 Quick Implementation Steps

### Step 1: Run Migration
```bash
npx prisma generate
npx prisma migrate dev --name add_reviews_giftcards_kds_delivery
```

### Step 2: Create Module Directories
```bash
mkdir -p src/modules/reviews
mkdir -p src/modules/gift-cards
mkdir -p src/modules/kds
mkdir -p src/modules/delivery/providers
```

### Step 3: Implement Services
Focus on core service logic:
- Reviews: CRUD + moderation + analytics
- Gift Cards: Purchase + redemption + balance tracking
- KDS: Status updates + metrics calculation
- Delivery: Webhook processing + order sync

### Step 4: Implement Controllers
Standard CRUD operations with proper validation

### Step 5: Create Routes
Register routes in app.js:
```javascript
app.use('/api/reviews', require('./modules/reviews/reviews.routes'));
app.use('/api/gift-cards', require('./modules/gift-cards/gift-cards.routes'));
app.use('/api/kds', require('./modules/kds/kds.routes'));
app.use('/api/delivery', require('./modules/delivery/delivery.routes'));
```

### Step 6: Add WebSocket Support for KDS
```javascript
// In src/realtime/kds.socket.js
io.of('/kds').on('connection', (socket) => {
  socket.on('subscribe', ({ stationId }) => {
    socket.join(`station:${stationId}`);
  });
});

// Emit updates when tickets change
io.of('/kds').to(`station:${stationId}`).emit('ticket:updated', ticket);
```

---

## 📊 Database Migration Example

The migration SQL will include:
- CREATE TABLE reviews
- CREATE TABLE review_responses
- CREATE TABLE review_media
- CREATE TABLE gift_cards
- CREATE TABLE gift_card_transactions
- CREATE TABLE store_credits
- CREATE TABLE store_credit_transactions
- CREATE TABLE delivery_providers
- CREATE TABLE delivery_integrations
- CREATE TABLE delivery_orders
- ALTER TABLE kitchen_tickets ADD COLUMN ... (multiple new columns)

---

## 🔒 Security Considerations

### Reviews
- Rate limiting: Max 1 review per order
- Verify customer owns the order
- Sanitize review content (prevent XSS)
- Moderate before displaying publicly (optional)

### Gift Cards
- Encrypt gift card codes in database
- Prevent brute-force balance checking (rate limit)
- Validate card hasn't expired
- Atomic balance operations (use database transactions)

### KDS
- WebSocket authentication required
- Only kitchen staff can update tickets
- Real-time updates isolated by station

### Delivery
- Verify webhook signatures
- Store provider credentials encrypted
- Rate limit webhook endpoints
- Validate order data before creating

---

## 📈 Metrics & Analytics

### Reviews
- Average rating by time period
- Response rate
- Sentiment analysis
- Common keywords

### Gift Cards
- Total cards sold
- Redemption rate
- Average card value
- Breakage (unredeemed value)

### KDS
- Average prep time by station
- On-time percentage
- Busiest hours
- Item velocity

### Delivery
- Orders by provider
- Commission costs
- Average delivery time
- Order accuracy rate

---

## 🧪 Testing Checklist

- [ ] Reviews: Create, update, delete, respond, moderate
- [ ] Gift Cards: Purchase, check balance, redeem (full/partial)
- [ ] Store Credit: Issue, apply to order
- [ ] KDS: Ticket workflow, metrics calculation
- [ ] Delivery: Webhook processing, order creation, status sync

---

## 📚 Documentation Needed

- API documentation for all endpoints
- Webhook signature verification guide
- Provider-specific integration guides
- WebSocket event reference
- Gift card purchase flow diagram
- KDS workflow diagram

---

## Next Steps

1. Generate Prisma client
2. Run database migration  
3. Implement service layers (prioritize based on business value)
4. Add comprehensive tests
5. Update API documentation
6. Deploy to staging for testing

All schemas are ready. You can now implement the business logic based on this guide!
