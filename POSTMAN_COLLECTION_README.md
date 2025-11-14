# TrueTab API - Postman Collection

## Overview
This Postman collection includes all TrueTab API endpoints organized by modules.

## Current Status
The collection file `TrueTab-API.postman_collection.json` has been generated with the following modules:

### ✅ Completed Modules (in collection)
1. **Health Check** - API health status
2. **Authentication** - Register, Login, Refresh, Logout, Request Demo
3. **Countries** - List countries
4. **Brands** - Create and list brands
5. **Branches** - Full CRUD operations
6. **Users** - User management and profile operations
7. **Customers** - Customer management with addresses
8. **Floor Management** - Zones and Tables with QR codes

### 📋 Remaining Modules (to be added)
9. **Menu Management**
   - Categories (List, Create, Update, Delete)
   - Items (List, Create, Get, Update, Delete, Upload Image)
   - Item Categories (Attach, List, Detach)
   - Item i18n (Upsert, Get, Delete)
   - Variants (List, Create, Update, Delete)
   - Branch Overrides (List, Upsert, Delete)
   - Modifier Groups (List, Create, Update, Delete)
   - Modifier Options (List, Create, Update, Delete)
   - Link modifier groups to items/variants

10. **Orders**
    - Create, List, Get, Update Order
    - Update Order Status
    - Add Items, Update Item, Remove Item
    - Apply/Remove Promotion
    - Take Payment, Refund Payment

11. **Inventory**
    - **Products**: List, Get, Create, Update, Delete
    - **Suppliers**: List, Get, Create, Update, Delete
    - **Purchase Orders**: List, Create, Receive
    - **Stock Transactions**: List, Create
    - **Adjustments**: (from adjustment.routes.js)
    - **Transfers**: (from transfer.routes.js)

12. **Recipes** - Recipe management

13. **Promotions**
    - List, Create, Get, Update, Delete
    - Toggle Promotion Status

14. **Registers & Sessions**
    - List, Create, Update Registers
    - Open/Close Register Sessions
    - List Sessions, Get Session
    - Create Cash Movement
    - Get Session Summary

15. **Taxes & Service Charges**
    - List, Create, Update, Delete Taxes
    - Service Charge routes

16. **Tips & Tip Settlement**
    - Tip management
    - Tip settlement operations

17. **Shifts & Attendance**
    - Shift Types (List, Create, Update, Delete)
    - Shifts (List, Create, Get, Update, Delete)
    - Clock In/Out
    - Break Start/End
    - Get Current Attendance
    - Get Attendance Records

18. **Payroll** - Payroll operations

19. **Loyalty Programs**
    - Programs (List, Create, Get, Update, Delete)
    - Tiers (Create, Update, Delete)
    - Customer Enrollment
    - Get Customer Loyalty
    - Earn/Redeem Points
    - Adjust Points
    - Get Customer Transactions
    - Rewards (List, Create, Update, Delete)

20. **Reservations**
    - List, Create, Get, Update
    - Cancel Reservation
    - Check Availability
    - Get Today's Reservations

21. **Marketing** - Marketing campaigns

22. **Gift Cards & Store Credit**
    - Purchase, List Gift Cards
    - Check Balance (Public)
    - Redeem Gift Card
    - Get Transaction History
    - Issue Store Credit
    - Get Customer Store Credit
    - Apply Store Credit

23. **Reviews** - Customer reviews

24. **KDS (Kitchen Display System)** - Kitchen operations

25. **Delivery**
    - Delivery operations
    - Delivery webhooks

26. **Subscriptions**
    - List Plans (Public)
    - Subscribe Brand
    - Start Trial
    - Get Brand Subscription
    - Create Checkout Session
    - Create Billing Portal Session
    - Cancel/Reactivate Subscription
    - Change Plan
    - Get Brand Invoices
    - Get Invoice by ID/Number
    - Get Payment Summary
    - Download Invoice PDF
    - Webhooks (Stripe and Polar)

27. **Wallet & Payouts**
    - Get Wallet Summary
    - Get Wallet Transactions
    - Request Payout
    - Get Payouts
    - Cancel/Process Payout
    - Bank Accounts management

28. **Online Ordering**
    - Get Public Menu (No auth)
    - Create Online Menu
    - Get Brand Online Menu
    - Update Menu Settings
    - Regenerate QR
    - Toggle Menu Status
    - Cart operations
    - Checkout operations
    - Online ordering webhooks

29. **AI Features** - AI-powered operations

30. **Admin Routes**
    - Demo Requests management

## How to Use

### Import into Postman
1. Open Postman
2. Click **Import** button
3. Select the `TrueTab-API.postman_collection.json` file
4. The collection will be imported with all folders and requests

### Configure Variables
After importing, set the following collection variables:
- `base_url`: Your API base URL (default: `http://localhost:9000`)
- `access_token`: Will be auto-filled after login
- `refresh_token`: Will be auto-filled after login
- `brand_id`: Your brand ID
- `branch_id`: Your branch ID

### Authentication Flow
1. First, call **Authentication > Register** or **Login**
2. The login request has a test script that automatically saves the tokens
3. All authenticated requests will use the `{{access_token}}` variable

### Common Headers
Most authenticated endpoints require:
- `Authorization: Bearer {{access_token}}`
- `X-Brand-ID: {{brand_id}}`
- `X-Branch-ID: {{branch_id}}` (for branch-scoped operations)

## API Endpoints Summary

### Base URL
```
http://localhost:9000/api
```

### Key Endpoint Patterns

#### Authentication
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/refresh`
- POST `/auth/logout`
- POST `/auth/request`

#### Resource Management (Standard CRUD)
Most resources follow this pattern:
- GET `/{resource}` - List all
- POST `/{resource}` - Create new
- GET `/{resource}/:id` - Get one
- PATCH/PUT `/{resource}/:id` - Update
- DELETE `/{resource}/:id` - Delete

#### Nested Resources
- GET `/customers/:id/orders` - Get customer orders
- POST `/orders/:id/items` - Add items to order
- GET `/registers/:id/sessions` - Get register sessions

## Notes

### Tenant-Scoped Endpoints
Many endpoints require tenant context via headers:
```
X-Brand-ID: {{brand_id}}
X-Branch-ID: {{branch_id}}
```

### Webhooks
Webhook endpoints expect raw body:
- `/api/subscription/webhook` - Stripe webhooks
- `/api/subscription/webhook/polar` - Polar webhooks
- `/api/delivery/webhook` - Delivery provider webhooks
- `/api/webhooks` - Online ordering webhooks

### Public Endpoints (No Authentication)
- GET `/api/health`
- GET `/api/countries`
- GET `/api/subscription/plans`
- GET `/api/online-menu/public/:urlSlug`
- GET `/api/gift-cards/:code/balance`

## Adding Remaining Endpoints

To complete the collection, you can manually add the remaining modules in Postman or extend the JSON file with the additional endpoint definitions following the same pattern shown in the existing requests.

## Environment Setup

### Development
```
base_url = http://localhost:9000
```

### Staging
```
base_url = https://staging-api.truetab.com
```

### Production
```
base_url = https://api.truetab.com
```

## Support

For questions or issues with the API, refer to:
- API Documentation: `/api-docs` (Swagger UI)
- Source code: `/src/modules/*/*.routes.js`
