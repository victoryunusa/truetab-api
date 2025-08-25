const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const { requireRole } = require("../../middleware/rbac");

const recipeController = require("./controllers/recipe.controller");
const recipeItemController = require("./controllers/recipe-item.controller");

// Common guards
const guards = [auth(true), tenant(true), requireActiveSubscription()];

// Guards for management operations (create, update, delete)
const managementGuards = [
  ...guards,
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER"),
];

/**
 * @openapi
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         itemId:
 *           type: string
 *           nullable: true
 *         variantId:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         lines:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecipeItem'
 *     RecipeItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         productId:
 *           type: string
 *         quantity:
 *           type: number
 *         wastePct:
 *           type: number
 *           nullable: true
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             unit:
 *               type: string
 */

/**
 * @openapi
 * /api/recipes:
 *   get:
 *     tags: [Recipes]
 *     summary: List all recipes
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *         description: Filter by menu item ID
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *         description: Filter by item variant ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recipe'
 */
router.get("/", guards, recipeController.list);

/**
 * @openapi
 * /api/recipes:
 *   post:
 *     tags: [Recipes]
 *     summary: Create a new recipe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               itemId:
 *                 type: string
 *                 nullable: true
 *               variantId:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 */
router.post("/", managementGuards, recipeController.create);

/**
 * @openapi
 * /api/recipes/{id}:
 *   get:
 *     tags: [Recipes]
 *     summary: Get recipe by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recipe details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Recipe'
 */
router.get("/:id", guards, recipeController.get);

/**
 * @openapi
 * /api/recipes/{id}:
 *   patch:
 *     tags: [Recipes]
 *     summary: Update recipe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               itemId:
 *                 type: string
 *                 nullable: true
 *               variantId:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 */
router.patch("/:id", managementGuards, recipeController.update);

/**
 * @openapi
 * /api/recipes/{id}:
 *   delete:
 *     tags: [Recipes]
 *     summary: Delete recipe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Recipe deleted successfully
 */
router.delete("/:id", managementGuards, recipeController.remove);

/**
 * @openapi
 * /api/recipes/{id}/duplicate:
 *   post:
 *     tags: [Recipes]
 *     summary: Duplicate an existing recipe
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               itemId:
 *                 type: string
 *                 nullable: true
 *               variantId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Recipe duplicated successfully
 */
router.post("/:id/duplicate", managementGuards, recipeController.duplicate);

/**
 * @openapi
 * /api/recipes/{id}/cost:
 *   get:
 *     tags: [Recipes]
 *     summary: Calculate recipe cost based on current product prices
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recipe cost calculation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     recipeId:
 *                       type: string
 *                     recipeName:
 *                       type: string
 *                     totalCost:
 *                       type: number
 *                     lines:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get("/:id/cost", guards, recipeController.calculateCost);

// Recipe Items Routes
/**
 * @openapi
 * /api/recipes/{recipeId}/items:
 *   get:
 *     tags: [Recipes]
 *     summary: List recipe items
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recipe items
 */
router.get("/:recipeId/items", guards, recipeItemController.list);

/**
 * @openapi
 * /api/recipes/{recipeId}/items:
 *   post:
 *     tags: [Recipes]
 *     summary: Add item to recipe
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               wastePct:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Recipe item created successfully
 */
router.post("/:recipeId/items", managementGuards, recipeItemController.create);

/**
 * @openapi
 * /api/recipes/{recipeId}/items/batch:
 *   put:
 *     tags: [Recipes]
 *     summary: Batch update recipe items
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Include for updates, omit for new items
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     wastePct:
 *                       type: number
 *                       nullable: true
 *     responses:
 *       200:
 *         description: Recipe items updated successfully
 */
router.put("/:recipeId/items/batch", managementGuards, recipeItemController.batchUpdate);

/**
 * @openapi
 * /api/recipes/items/{id}:
 *   get:
 *     tags: [Recipes]
 *     summary: Get recipe item by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recipe item details
 */
router.get("/items/:id", guards, recipeItemController.get);

/**
 * @openapi
 * /api/recipes/items/{id}:
 *   patch:
 *     tags: [Recipes]
 *     summary: Update recipe item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               wastePct:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Recipe item updated successfully
 */
router.patch("/items/:id", managementGuards, recipeItemController.update);

/**
 * @openapi
 * /api/recipes/items/{id}:
 *   delete:
 *     tags: [Recipes]
 *     summary: Delete recipe item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Recipe item deleted successfully
 */
router.delete("/items/:id", managementGuards, recipeItemController.remove);

module.exports = router;
