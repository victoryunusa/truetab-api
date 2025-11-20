# Menu Item Variants - Quick Reference

## 🚨 IMPORTANT: Menu Items Need Variants for Prices!

Menu items **do NOT have a price field**. Prices are stored in **variants**.

---

## Quick Setup

### Step 1: Create a Menu Item
```http
POST /api/menu/items

{
  "defaultName": "Cappuccino",
  "description": "Classic Italian coffee with steamed milk",
  "isActive": true
}
```

### Step 2: Add Variant(s) with Price
```http
POST /api/menu/items/{ITEM_ID}/variants

{
  "name": "Regular",
  "price": 4.99
}
```

✅ **Now your item has a price!**

---

## Common Patterns

### Single Price Item
```json
{
  "name": "Regular",
  "price": 12.99
}
```

### Multiple Sizes
```json
// Create 3 separate requests with different data:

// Request 1:
{
  "name": "Small",
  "price": 2.99,
  "sortOrder": 1
}

// Request 2:
{
  "name": "Medium",
  "price": 3.99,
  "sortOrder": 2
}

// Request 3:
{
  "name": "Large",
  "price": 4.99,
  "sortOrder": 3
}
```

---

## All Variant Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/menu/items/:id/variants` | Create variant |
| `GET` | `/api/menu/items/:id/variants` | List all variants for item |
| `PATCH` | `/api/variants/:variantId` | Update variant |
| `DELETE` | `/api/variants/:variantId` | Delete variant |
| `POST` | `/api/variants/:variantId/branches/:branchId` | Branch-specific price |

---

## Verify Items Have Prices

```http
GET /api/menu/items/:id
```

Response should show:
```json
{
  "data": {
    "id": "xxx",
    "defaultName": "Cappuccino",
    "variants": [
      {
        "id": "yyy",
        "name": "Regular",
        "price": "4.99"
      }
    ]
  }
}
```

If `variants` array is empty → **No prices set!**

---

## Database Structure

```
menu_items
  ├─ id
  ├─ defaultName
  ├─ description
  └─ (NO price field)

menu_item_variants
  ├─ id
  ├─ itemId
  ├─ name
  └─ price ← Price is here!
```

---

For detailed guide, see: **MENU_VARIANTS_GUIDE.md**
