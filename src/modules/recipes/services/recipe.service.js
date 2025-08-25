const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function list({ brandId, itemId, variantId, isActive }) {
  const where = { brandId };
  
  if (itemId) where.itemId = itemId;
  if (variantId) where.variantId = variantId;
  if (typeof isActive === 'boolean') where.isActive = isActive;

  return prisma.recipe.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      item: {
        select: { id: true, defaultName: true }
      },
      variant: {
        select: { id: true, name: true },
        include: {
          item: {
            select: { id: true, defaultName: true }
          }
        }
      },
      lines: {
        include: {
          product: {
            select: { id: true, name: true, unit: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: { lines: true }
      }
    },
  });
}

async function create({ brandId, name, itemId, variantId, isActive = true }) {
  // Validate that item or variant exists and belongs to brand
  if (itemId) {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, brandId }
    });
    if (!item) throw new Error("Menu item not found in this brand");
  }

  if (variantId) {
    const variant = await prisma.itemVariant.findFirst({
      where: { 
        id: variantId,
        item: { brandId }
      },
      include: { item: true }
    });
    if (!variant) throw new Error("Item variant not found in this brand");
  }

  // Check for duplicate recipe name for the same item/variant
  const existing = await prisma.recipe.findFirst({
    where: {
      brandId,
      name,
      itemId: itemId || null,
      variantId: variantId || null
    }
  });

  if (existing) {
    throw new Error("Recipe with this name already exists for this item/variant");
  }

  return prisma.recipe.create({
    data: {
      brandId,
      name,
      itemId: itemId || null,
      variantId: variantId || null,
      isActive
    },
    include: {
      item: {
        select: { id: true, defaultName: true }
      },
      variant: {
        select: { id: true, name: true },
        include: {
          item: {
            select: { id: true, defaultName: true }
          }
        }
      },
      lines: {
        include: {
          product: {
            select: { id: true, name: true, unit: true }
          }
        }
      }
    }
  });
}

async function get(id, { brandId }) {
  const recipe = await prisma.recipe.findFirst({
    where: { id, brandId },
    include: {
      item: {
        select: { id: true, defaultName: true }
      },
      variant: {
        select: { id: true, name: true },
        include: {
          item: {
            select: { id: true, defaultName: true }
          }
        }
      },
      lines: {
        include: {
          product: {
            select: { id: true, name: true, unit: true, costPrice: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!recipe) throw new Error("Recipe not found");
  return recipe;
}

async function update(id, { brandId, name, itemId, variantId, isActive }) {
  const existing = await prisma.recipe.findFirst({
    where: { id, brandId }
  });
  
  if (!existing) throw new Error("Recipe not found");

  // Validate item/variant if provided
  if (itemId) {
    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, brandId }
    });
    if (!item) throw new Error("Menu item not found in this brand");
  }

  if (variantId) {
    const variant = await prisma.itemVariant.findFirst({
      where: { 
        id: variantId,
        item: { brandId }
      }
    });
    if (!variant) throw new Error("Item variant not found in this brand");
  }

  // Check for duplicate name if name is being changed
  if (name && name !== existing.name) {
    const duplicate = await prisma.recipe.findFirst({
      where: {
        brandId,
        name,
        itemId: itemId || existing.itemId,
        variantId: variantId || existing.variantId,
        id: { not: id }
      }
    });

    if (duplicate) {
      throw new Error("Recipe with this name already exists for this item/variant");
    }
  }

  return prisma.recipe.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(typeof itemId !== 'undefined' && { itemId: itemId || null }),
      ...(typeof variantId !== 'undefined' && { variantId: variantId || null }),
      ...(typeof isActive === 'boolean' && { isActive })
    },
    include: {
      item: {
        select: { id: true, defaultName: true }
      },
      variant: {
        select: { id: true, name: true },
        include: {
          item: {
            select: { id: true, defaultName: true }
          }
        }
      },
      lines: {
        include: {
          product: {
            select: { id: true, name: true, unit: true }
          }
        }
      }
    }
  });
}

async function remove(id, { brandId }) {
  const existing = await prisma.recipe.findFirst({
    where: { id, brandId }
  });
  
  if (!existing) throw new Error("Recipe not found");

  // Delete recipe items first (cascade)
  await prisma.recipeItem.deleteMany({
    where: { recipeId: id }
  });

  return prisma.recipe.delete({
    where: { id }
  });
}

async function duplicate(id, { brandId, name, itemId, variantId }) {
  const original = await prisma.recipe.findFirst({
    where: { id, brandId },
    include: {
      lines: true
    }
  });

  if (!original) throw new Error("Original recipe not found");

  // Create the new recipe
  const newRecipe = await create({
    brandId,
    name,
    itemId,
    variantId,
    isActive: original.isActive
  });

  // Copy all recipe items
  if (original.lines.length > 0) {
    const recipeItemsData = original.lines.map(line => ({
      recipeId: newRecipe.id,
      productId: line.productId,
      quantity: line.quantity,
      wastePct: line.wastePct
    }));

    await prisma.recipeItem.createMany({
      data: recipeItemsData
    });
  }

  return get(newRecipe.id, { brandId });
}

// Calculate total cost of recipe based on current product prices
async function calculateCost(id, { brandId }) {
  const recipe = await get(id, { brandId });
  
  let totalCost = 0;
  
  for (const line of recipe.lines) {
    if (line.product.costPrice) {
      let lineCost = line.quantity * line.product.costPrice;
      
      // Apply waste percentage if specified
      if (line.wastePct && line.wastePct > 0) {
        lineCost = lineCost * (1 + (line.wastePct / 100));
      }
      
      totalCost += lineCost;
    }
  }

  return {
    recipeId: id,
    recipeName: recipe.name,
    totalCost: parseFloat(totalCost.toFixed(2)),
    lines: recipe.lines.map(line => {
      const baseCost = line.product.costPrice ? line.quantity * line.product.costPrice : 0;
      const wastedCost = line.wastePct ? baseCost * (line.wastePct / 100) : 0;
      const totalLineCost = baseCost + wastedCost;
      
      return {
        productId: line.productId,
        productName: line.product.name,
        quantity: line.quantity,
        unit: line.product.unit,
        costPrice: line.product.costPrice,
        baseCost: parseFloat(baseCost.toFixed(2)),
        wastePct: line.wastePct,
        wastedCost: parseFloat(wastedCost.toFixed(2)),
        totalLineCost: parseFloat(totalLineCost.toFixed(2))
      };
    })
  };
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  duplicate,
  calculateCost,
};
