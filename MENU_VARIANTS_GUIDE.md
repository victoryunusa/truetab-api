# Menu Item Variants & Pricing Guide

## Understanding the Architecture

In TrueTab, menu items don't have prices directly. Instead, prices are stored in **variants**.

### Structure:
```
MenuItem (e.g., "Coffee")
  └── ItemVariant (e.g., "Small" - $2.99)
  └── ItemVariant (e.g., "Medium" - $3.99)
  └── ItemVariant (e.g., "Large" - $4.99)
```

### Why?
This allows:
- Multiple size options with different prices
- Different prices per branch (via branch overrides)
- Flexibility for items with single or multiple variants

---

## API Endpoints

### 1. Create a Variant for a Menu Item

**Endpoint:** `POST /api/menu/items/:id/variants`

**Required Fields:**
- `name` - Variant name (e.g., "Small", "Medium", "Regular", "Default")
- `price` - Price in decimal format (e.g., 9.99)

**Optional Fields:**
- `costPrice` - Your cost price (for profit tracking)
- `sku` - Stock keeping unit code
- `isActive` - Whether variant is available (default: true)
- `sortOrder` - Display order (default: 0)

---

## Example Requests

### Single-Size Item (e.g., Burger)

```json
POST /api/menu/items/{{ITEM_ID}}/variants

{
  "name": "Regular",
  "price": 12.99,
  "costPrice": 5.50,
  "isActive": true
}
```

### Multi-Size Item (e.g., Drinks)

```json
// Small Coffee
POST /api/menu/items/{{ITEM_ID}}/variants

{
  "name": "Small",
  "price": 2.99,
  "costPrice": 0.80,
  "sortOrder": 1
}

// Medium Coffee
POST /api/menu/items/{{ITEM_ID}}/variants

{
  "name": "Medium",
  "price": 3.99,
  "costPrice": 1.00,
  "sortOrder": 2
}

// Large Coffee
POST /api/menu/items/{{ITEM_ID}}/variants

{
  "name": "Large",
  "price": 4.99,
  "costPrice": 1.20,
  "sortOrder": 3
}
```

---

## Other Variant Operations

### Get All Variants for an Item

```http
GET /api/menu/items/:id/variants
```

Response includes all variants with their prices.

### Update a Variant

```http
PATCH /api/variants/:variantId

{
  "price": 13.99,
  "name": "Regular Updated"
}
```

### Delete a Variant

```http
DELETE /api/variants/:variantId
```

---

## Branch-Specific Pricing

You can override prices per branch:

```http
POST /api/variants/:variantId/branches/:branchId

{
  "price": 5.99,
  "isAvailable": true
}
```

This is useful when:
- Different branches have different pricing
- A variant is temporarily unavailable at a specific branch

---

## Verifying Your Menu Items Have Prices

### Check Single Item

```http
GET /api/menu/items/:id
```

Look for the `variants` array in the response:

```json
{
  "data": {
    "id": "xxx",
    "defaultName": "Coffee",
    "variants": [
      {
        "id": "yyy",
        "name": "Small",
        "price": "2.99",
        "isActive": true
      },
      {
        "id": "zzz",
        "name": "Large",
        "price": "4.99",
        "isActive": true
      }
    ]
  }
}
```

### Check All Items

```http
GET /api/menu/items
```

Each item in the response will include its `variants` array with prices.

---

## Common Issues & Solutions

### ❌ Problem: Menu items showing without prices

**Cause:** No variants created for the items

**Solution:** Create at least one variant per item with the steps above

---

### ❌ Problem: Prices showing as strings not numbers

**Cause:** Prisma returns Decimal fields as strings to preserve precision

**Solution:** This is normal. Parse them as floats in your frontend:
```javascript
parseFloat(variant.price)
```

---

### ❌ Problem: Can't create variant - "Item not found"

**Cause:** Item ID is incorrect or belongs to a different brand

**Solution:** 
1. Verify the item ID with `GET /api/menu/items`
2. Ensure you're authenticated with the correct brand

---

## Quick Start Checklist

- [ ] Create menu categories
- [ ] Create menu items
- [ ] **Create variants for each item** ← You need this for prices!
- [ ] (Optional) Link items to categories
- [ ] (Optional) Add modifiers

---

## Best Practices

1. **Always create at least one variant** for every menu item
2. **Use descriptive names** - "Regular", "Small/Medium/Large", "Single/Double"
3. **Set sortOrder** to control how variants appear to customers
4. **Use costPrice** to track profitability
5. **Consider branch overrides** for location-specific pricing

---

## Need Help?

Check the Postman collection for working examples of all these endpoints!
