# Menu Module Branch Scoping Implementation

## Overview
The menu module has been updated to support branch scoping. Previously, all menu data (categories, items, modifier groups, and variants) were scoped only by `brandId`, making them visible across all branches within a brand. Now, the module properly filters data by `branchId` when provided.

## Changes Made

### Database Schema
The following models already had `branchId` fields (added via migration `20251120213022_updated_brand_scope_to_menu_and_inventory`):
- `MenuCategory` 
- `MenuItem`
- `ModifierGroup`

### Services Updated

#### 1. **category.service.js**
- Added `buildScope(brandId, branchId)` helper function
- Added `assertBranchInBrand(branchId, brandId)` validation function
- Updated all functions to accept and use `branchId`:
  - `list({ brandId, branchId })`
  - `create({ brandId, branchId, ... })`
  - `update(id, { brandId, branchId, ... })`
  - `remove(id, { brandId, branchId })`

#### 2. **item.service.js**
- Added `buildScope(brandId, branchId)` helper function
- Added `assertBranchInBrand(branchId, brandId)` validation function
- Updated all functions to accept and use `branchId`:
  - `list({ brandId, branchId })`
  - `create({ brandId, branchId, ... })`
  - `get(id, { brandId, branchId })`
  - `update(id, { brandId, branchId, ... })`
  - `remove(id, { brandId, branchId })`
  - `attachCategories(itemId, { brandId, branchId, ... })`
  - `listCategories(itemId, { brandId, branchId })`
  - `detachCategory(itemId, categoryId, { brandId, branchId })`
  - `upsertI18n(itemId, { brandId, branchId, ... })`
  - `getI18n(itemId, { brandId, branchId })`
  - `deleteI18n(itemId, locale, { brandId, branchId })`
  - `linkModifierGroups(itemId, { brandId, branchId, ... })`

#### 3. **modifier-group.service.js**
- Added `buildScope(brandId, branchId)` helper function
- Added `assertBranchInBrand(branchId, brandId)` validation function
- Updated all functions to accept and use `branchId`:
  - `list({ brandId, branchId })`
  - `create({ brandId, branchId, ... })`
  - `update(id, { brandId, branchId, ... })`
  - `remove(id, { brandId, branchId })`

#### 4. **modifier-option.service.js**
- Added `buildScope(brandId, branchId)` helper function
- Updated all functions to accept and use `branchId`:
  - `list(groupId, { brandId, branchId })`
  - `create(groupId, { brandId, branchId, ... })`
  - `update(id, { brandId, branchId, ... })`
  - `remove(id, { brandId, branchId })`

#### 5. **variant.service.js**
- Added `buildScope(brandId, branchId)` helper function
- Updated all functions to accept and use `branchId`:
  - `listForItem(itemId, { brandId, branchId })`
  - `createForItem(itemId, { brandId, branchId, ... })`
  - `update(variantId, { brandId, branchId, ... })`
  - `remove(variantId, { brandId, branchId })`
  - `listBranchOverrides(variantId, { brandId, branchId })`
  - `upsertBranchOverride(variantId, branchId, { brandId, branchIdContext, ... })`
  - `deleteBranchOverride(variantId, branchId, { brandId, branchIdContext })`
  - `linkModifierGroups(variantId, { brandId, branchId, ... })`

### Controllers Updated

All controllers now pass `branchId` from `req.tenant.branchId` to their respective service calls:

1. **category.controller.js** - All CRUD operations
2. **item.controller.js** - All CRUD operations and helper functions
3. **modifier-group.controller.js** - All CRUD operations
4. **modifier-option.controller.js** - All CRUD operations
5. **variant.controller.js** - All CRUD operations and helper functions

### How It Works

#### Branch Scoping Logic
```javascript
function buildScope(brandId, branchId) {
  const where = { brandId };
  if (branchId) {
    where.branchId = branchId;
  }
  return where;
}
```

This function:
- Always filters by `brandId` (required)
- Adds `branchId` filter only when provided (optional)
- Allows brand-level queries when `branchId` is null/undefined
- Enables branch-specific queries when `branchId` is provided

#### Request Flow
1. Client sends request with headers: `x-brand-id` and optionally `x-branch-id`
2. Tenant middleware extracts these into `req.tenant.brandId` and `req.tenant.branchId`
3. Controller passes both values to service
4. Service uses `buildScope()` to build the appropriate query filter
5. Data is returned scoped to the branch (if provided) or brand-wide (if not)

## Usage Examples

### Brand-level Query (No Branch Scoping)
```bash
# Request without x-branch-id header
GET /api/menu/items
Headers: x-brand-id: brand-123

# Returns all items for the brand across all branches
```

### Branch-level Query (With Branch Scoping)
```bash
# Request with x-branch-id header
GET /api/menu/items
Headers: 
  x-brand-id: brand-123
  x-branch-id: branch-456

# Returns only items for the specific branch
```

### Creating Branch-specific Items
```bash
POST /api/menu/items
Headers: 
  x-brand-id: brand-123
  x-branch-id: branch-456
Body: {
  "defaultName": "Special Burger",
  "description": "Only at this branch"
}

# Creates an item scoped to branch-456
```

## Backward Compatibility

The implementation is backward compatible:
- Existing data with `branchId = null` remains brand-scoped
- Requests without `x-branch-id` header work as before (brand-level)
- New data can be created with or without branch association

## Benefits

1. **Multi-branch Support**: Each branch can have its own menu
2. **Shared Items**: Items can still be shared across branches (when `branchId` is null)
3. **Flexibility**: Supports both centralized and decentralized menu management
4. **Data Isolation**: Prevents cross-branch data leakage
5. **Granular Control**: Branch managers can only see/manage their branch's menu

## Testing Recommendations

1. Test listing items with and without `x-branch-id` header
2. Verify item creation with branch association
3. Test that branch A cannot access branch B's menu items
4. Verify brand-level items (branchId=null) are visible to all branches
5. Test category and modifier group scoping
6. Verify variant operations with branch context

## Related Files

### Services
- `src/modules/menu/services/category.service.js`
- `src/modules/menu/services/item.service.js`
- `src/modules/menu/services/modifier-group.service.js`
- `src/modules/menu/services/modifier-option.service.js`
- `src/modules/menu/services/variant.service.js`

### Controllers
- `src/modules/menu/controllers/category.controller.js`
- `src/modules/menu/controllers/item.controller.js`
- `src/modules/menu/controllers/modifier-group.controller.js`
- `src/modules/menu/controllers/modifier-option.controller.js`
- `src/modules/menu/controllers/variant.controller.js`

### Middleware
- `src/middleware/tenant.js` - Extracts brandId and branchId from request

### Database
- `prisma/schema.prisma` - Schema definitions
- `prisma/migrations/20251120213022_updated_brand_scope_to_menu_and_inventory/migration.sql` - Migration that added branchId fields
