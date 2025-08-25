const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list(recipeId, { brandId }) {
  // Verify recipe belongs to brand
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, brandId }
  });

  if (!recipe) throw new Error("Recipe not found");

  return prisma.recipeItem.findMany({
    where: { recipeId },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: { 
          id: true, 
          name: true, 
          unit: true, 
          costPrice: true,
          isActive: true 
        }
      }
    }
  });
}

async function create(recipeId, { brandId, productId, quantity, wastePct }) {
  // Verify recipe belongs to brand
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, brandId }
  });

  if (!recipe) throw new Error("Recipe not found");

  // Verify product exists and belongs to brand
  const product = await prisma.product.findFirst({
    where: { id: productId, brandId }
  });

  if (!product) throw new Error("Product not found in this brand");

  // Check if product is already in this recipe
  const existing = await prisma.recipeItem.findFirst({
    where: { recipeId, productId }
  });

  if (existing) throw new Error("Product is already in this recipe");

  return prisma.recipeItem.create({
    data: {
      recipeId,
      productId,
      quantity,
      wastePct: wastePct || null
    },
    include: {
      product: {
        select: { 
          id: true, 
          name: true, 
          unit: true, 
          costPrice: true 
        }
      }
    }
  });
}

async function get(id, { brandId }) {
  const recipeItem = await prisma.recipeItem.findFirst({
    where: { 
      id,
      recipe: { brandId }
    },
    include: {
      recipe: {
        select: { id: true, name: true }
      },
      product: {
        select: { 
          id: true, 
          name: true, 
          unit: true, 
          costPrice: true 
        }
      }
    }
  });

  if (!recipeItem) throw new Error("Recipe item not found");
  return recipeItem;
}

async function update(id, { brandId, productId, quantity, wastePct }) {
  const existing = await prisma.recipeItem.findFirst({
    where: { 
      id,
      recipe: { brandId }
    },
    include: {
      recipe: true
    }
  });

  if (!existing) throw new Error("Recipe item not found");

  // If changing product, verify new product exists and belongs to brand
  if (productId && productId !== existing.productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, brandId }
    });

    if (!product) throw new Error("Product not found in this brand");

    // Check if new product is already in this recipe
    const duplicate = await prisma.recipeItem.findFirst({
      where: { 
        recipeId: existing.recipeId, 
        productId,
        id: { not: id }
      }
    });

    if (duplicate) throw new Error("Product is already in this recipe");
  }

  return prisma.recipeItem.update({
    where: { id },
    data: {
      ...(productId && { productId }),
      ...(typeof quantity === 'number' && { quantity }),
      ...(typeof wastePct !== 'undefined' && { wastePct: wastePct || null })
    },
    include: {
      product: {
        select: { 
          id: true, 
          name: true, 
          unit: true, 
          costPrice: true 
        }
      }
    }
  });
}

async function remove(id, { brandId }) {
  const existing = await prisma.recipeItem.findFirst({
    where: { 
      id,
      recipe: { brandId }
    }
  });

  if (!existing) throw new Error("Recipe item not found");

  return prisma.recipeItem.delete({
    where: { id }
  });
}

async function batchUpdate(recipeId, { brandId, items }) {
  // Verify recipe belongs to brand
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, brandId }
  });

  if (!recipe) throw new Error("Recipe not found");

  // Get all current recipe items
  const currentItems = await prisma.recipeItem.findMany({
    where: { recipeId }
  });

  const currentItemIds = currentItems.map(item => item.id);
  const updatedItemIds = items.filter(item => item.id).map(item => item.id);
  const itemsToDelete = currentItemIds.filter(id => !updatedItemIds.includes(id));

  return prisma.$transaction(async (tx) => {
    // Delete removed items
    if (itemsToDelete.length > 0) {
      await tx.recipeItem.deleteMany({
        where: { id: { in: itemsToDelete } }
      });
    }

    // Process each item (update existing or create new)
    const results = [];
    
    for (const item of items) {
      // Verify product exists and belongs to brand
      const product = await tx.product.findFirst({
        where: { id: item.productId, brandId }
      });

      if (!product) {
        throw new Error(`Product ${item.productId} not found in this brand`);
      }

      if (item.id) {
        // Update existing item
        const updated = await tx.recipeItem.update({
          where: { id: item.id },
          data: {
            productId: item.productId,
            quantity: item.quantity,
            wastePct: item.wastePct || null
          },
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                unit: true, 
                costPrice: true 
              }
            }
          }
        });
        results.push(updated);
      } else {
        // Create new item
        // Check if product is already in this recipe
        const duplicate = await tx.recipeItem.findFirst({
          where: { recipeId, productId: item.productId }
        });

        if (duplicate) {
          throw new Error(`Product ${item.productId} is already in this recipe`);
        }

        const created = await tx.recipeItem.create({
          data: {
            recipeId,
            productId: item.productId,
            quantity: item.quantity,
            wastePct: item.wastePct || null
          },
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                unit: true, 
                costPrice: true 
              }
            }
          }
        });
        results.push(created);
      }
    }

    return results;
  });
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  batchUpdate,
};
