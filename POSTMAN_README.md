# TrueTab API Postman Collection

This directory contains a complete Postman collection and environment for testing the TrueTab restaurant management API.

## Files

- `TrueTab-API.postman_collection.json` - The main Postman collection with all API endpoints
- `TrueTab-API.postman_environment.json` - Environment variables for the collection
- `POSTMAN_README.md` - This documentation file

## Setup Instructions

### 1. Import into Postman

1. Open Postman
2. Click "Import" button
3. Select both files:
   - `TrueTab-API.postman_collection.json`
   - `TrueTab-API.postman_environment.json`
4. Select "TrueTab API Environment" from the environment dropdown in the top right

### 2. Configure Environment Variables

The environment comes pre-configured with the following key variables:

- `base_url`: Set to `http://localhost:9000/api` (change if your server runs on different host/port)
- `auth_token`: Automatically populated after login
- `refresh_token`: Automatically populated after login
- Other IDs (`brand_id`, `branch_id`, etc.): Set these manually as you create resources

### 3. Start Your API Server

Make sure your TrueTab API server is running:

```bash
npm run dev
```

The server should be accessible at `http://localhost:9000` by default.

## Usage Guide

### Authentication Flow

1. **Health Check**: Start by testing the health endpoint to ensure your API is running
2. **Register or Login**: Use the authentication endpoints to get an access token
   - The token is automatically saved to the `auth_token` environment variable
   - The refresh token is saved to `refresh_token`
3. **Set Brand ID**: After creating or getting a brand, copy the brand ID to the `brand_id` environment variable

### API Organization

The collection is organized into the following sections:

#### 🏥 Health Check
- `GET /health` - Check API status, database and Redis connectivity

#### 🔐 Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with email/password
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout and invalidate tokens

#### 🌍 Countries
- `GET /countries` - List available countries

#### 🏪 Brands
- `POST /brands` - Create a new brand
- `GET /brands` - List brands

#### 🏢 Branches
- `GET /branches` - List branches in a brand
- `POST /branches` - Create a new branch

#### 👥 Users
- `GET /users` - List users in brand
- `POST /users/invite` - Invite new user
- `PUT /users/:id/role` - Update user role
- `PUT /users/me` - Update own profile
- `DELETE /users/:id` - Deactivate user

#### 🍽️ Orders
Complete order management with:
- Order CRUD operations
- Order status management
- Order item management
- Promotion application
- Payment processing
- Refunds

#### 📋 Menu Management
Organized into sub-sections:

**Categories**
- List, create, update, delete menu categories

**Items** 
- Full menu item CRUD
- Category associations
- Image uploads
- Multi-language support (i18n)

**Modifier Groups**
- Size options, add-ons, customizations

#### 📦 Inventory
**Products**
- Inventory product management
- SKU tracking
- Unit costs and suppliers

**Suppliers**
- Supplier contact management
- Supply chain tracking

#### 💰 Taxes
- Tax configuration management
- Percentage and fixed taxes
- Active/inactive status

#### 📄 Subscriptions
- List subscription plans (public)
- Subscribe brand to plan
- Start trial subscription
- Get brand subscription details

#### 🏗️ Floor Management
**Zones**
- Create, list, update, delete dining zones
- Visual floor plan organization

**Tables**
- Full table management CRUD
- Table positioning (x, y coordinates)
- Capacity and shape settings
- QR code generation for table ordering

#### 💰 Registers & Cash Management
**Registers**
- Register setup and configuration
- Location and branch assignment

**Sessions**
- Open/close register sessions
- Cash float management
- Cash movements (payouts, deposits)
- Session summaries and reporting

#### 🔧 Service Charges
- Configure service charge rates
- Percentage or fixed amount settings
- Branch-specific configurations

#### 💵 Tips Management
- Record tips for staff
- Tips summary reporting
- Filter by date ranges and staff

#### 🧾 Tip Settlement
- Create tip settlements for staff
- Bulk settlement processing
- Settlement history tracking

#### 🍳 Recipes
- Recipe creation and management
- Link recipes to menu items/variants
- Recipe costing calculations
- Recipe ingredient management
- Batch update recipe components
- Recipe duplication
- Waste percentage tracking

#### 📦 Extended Inventory
**Stock Transactions**
- Track all stock movements
- Stock in/out transactions
- Reference tracking (PO numbers)

**Purchase Orders**
- Create and manage purchase orders
- Supplier-specific ordering
- Receive deliveries with variance tracking
- Partial delivery support

**Adjustments**
- Stock count adjustments
- Damage and loss tracking
- Adjustment reason tracking

**Transfers**
- Inter-branch stock transfers
- Transfer completion workflow
- Transfer item tracking

#### 🎁 Promotions
- Complete promotion CRUD
- Promotion code management
- Date range and status control
- Toggle active/inactive status

#### 📧 Invitations
- Accept user invitations
- Public invitation acceptance flow

## Authentication & Authorization

### Token Management
- Access tokens are automatically managed through test scripts
- Tokens are stored in environment variables
- Login and register requests automatically save tokens

### Multi-tenancy
Most endpoints require a `X-Brand-ID` header for tenant isolation:
- Set your `brand_id` environment variable after creating/selecting a brand
- The collection automatically includes this header where needed

### Role-based Access
The API uses role-based access control with these roles:
- `SUPER_ADMIN` - Full system access
- `BRAND_OWNER` - Full brand access
- `BRAND_ADMIN` - Brand management
- `BRANCH_MANAGER` - Branch operations
- `STAFF` - Basic operations

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:9000/api` |
| `auth_token` | JWT access token | Auto-populated |
| `refresh_token` | JWT refresh token | Auto-populated |
| `brand_id` | Current brand ID | `uuid-string` |
| `branch_id` | Current branch ID | `uuid-string` |
| `user_id` | User ID for operations | `uuid-string` |
| `order_id` | Order ID for operations | `uuid-string` |
| `item_id` | Menu item ID | `uuid-string` |
| `product_id` | Inventory product ID | `uuid-string` |

## Test Scripts

The collection includes test scripts that:

1. **Auto-save authentication tokens** after login/register
2. **Validate response status codes**
3. **Extract IDs from responses** (you can manually copy these to environment variables)

## Common Workflows

### 1. Setting up a new restaurant

1. Register/Login as a user
2. Create a brand
3. Copy the brand ID to `brand_id` environment variable
4. Create a branch
5. Create menu categories and items
6. Set up inventory products and suppliers
7. Configure taxes

### 2. Processing an order

1. Create an order with initial items
2. Add more items if needed
3. Apply promotions
4. Take payment
5. Update order status

### 3. Managing inventory

1. Create suppliers
2. Create products with supplier associations
3. Track stock levels
4. Generate purchase orders

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Make sure you're logged in and the `auth_token` is set
2. **403 Forbidden**: Check your user role and permissions
3. **Tenant scope errors**: Ensure `brand_id` is set in environment variables
4. **Connection errors**: Verify API server is running and base_url is correct

### Debug Tips

- Use the Postman console to see request/response details
- Check the test results tab for automatic token extraction
- Verify environment variables are set correctly
- Start with the health check endpoint to test connectivity

## API Documentation

Your API also includes Swagger documentation available at:
`http://localhost:9000/api-docs`

This provides additional details about request schemas, validation rules, and response formats.

## Support

For issues with the API itself, check the server logs. For Postman collection issues, verify:

1. Environment is selected correctly
2. All required variables are populated  
3. Server is running and accessible
4. Authentication tokens are valid (try re-logging in)