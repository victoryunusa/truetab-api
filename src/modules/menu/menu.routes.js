const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");

// Controllers
const cat = require("./controllers/category.controller");
const item = require("./controllers/item.controller");
const modg = require("./controllers/modifier-group.controller");
const modo = require("./controllers/modifier-option.controller");
const variant = require("./controllers/variant.controller");
const upload = require("./controllers/upload.controller");

// Common guards
const guards = [auth(true), tenant(true), requireActiveSubscription()];

// Categories
router.get("/categories", ...guards, cat.list);
router.post("/categories", ...guards, cat.create);
router.patch("/categories/:id", ...guards, cat.update);
router.delete("/categories/:id", ...guards, cat.remove);

// Items
router.get("/items", ...guards, item.list);
router.post("/items", ...guards, item.create);
router.get("/items/:id", ...guards, item.get);
router.patch("/items/:id", ...guards, item.update);
router.delete("/items/:id", ...guards, item.remove);

// Item ↔ Category links
router.post("/items/:id/categories", ...guards, item.attachCategories);
router.get("/items/:id/categories", ...guards, item.listCategories);
router.delete(
  "/items/:id/categories/:categoryId",
  ...guards,
  item.detachCategory
);

// Item i18n
router.post("/items/:id/i18n", ...guards, item.upsertI18n);
router.get("/items/:id/i18n", ...guards, item.getI18n);
router.delete("/items/:id/i18n/:locale", ...guards, item.deleteI18n);

// Variants
router.get("/items/:id/variants", ...guards, variant.listForItem);
router.post("/items/:id/variants", ...guards, variant.createForItem);
router.patch("/variants/:variantId", ...guards, variant.update);
router.delete("/variants/:variantId", ...guards, variant.remove);

// Branch overrides (price/availability)
router.get(
  "/variants/:variantId/branches",
  ...guards,
  variant.listBranchOverrides
);
router.post(
  "/variants/:variantId/branches/:branchId",
  ...guards,
  variant.upsertBranchOverride
);
router.delete(
  "/variants/:variantId/branches/:branchId",
  ...guards,
  variant.deleteBranchOverride
);

// Modifier Groups & Options
router.get("/modifier-groups", ...guards, modg.list);
router.post("/modifier-groups", ...guards, modg.create);
router.patch("/modifier-groups/:id", ...guards, modg.update);
router.delete("/modifier-groups/:id", ...guards, modg.remove);

router.get("/modifier-groups/:groupId/options", ...guards, modo.list);
router.post("/modifier-groups/:groupId/options", ...guards, modo.create);
router.patch("/modifier-options/:id", ...guards, modo.update);
router.delete("/modifier-options/:id", ...guards, modo.remove);

// Link groups to items/variants
router.post("/items/:id/modifier-groups", ...guards, item.linkModifierGroups);
router.post(
  "/variants/:variantId/modifier-groups",
  ...guards,
  variant.linkModifierGroups
);

// Image upload (Cloudinary)
router.post("/items/:id/image", ...guards, upload.uploadItemImage);

module.exports = router;
