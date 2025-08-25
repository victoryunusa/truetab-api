const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function inBrand(where, brandId) {
  return { ...where, brandId };
}

async function list({ brandId }) {
  return prisma.menuItem.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
    include: {
      variants: {
        include: {
          recipes: {
            select: {
              id: true,
              name: true,
              isActive: true,
              _count: { select: { lines: true } }
            }
          }
        }
      },
      categories: { include: { category: true } },
      modifierLinks: { include: { group: true } },
      recipes: {
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: { select: { lines: true } }
        }
      },
    },
  });
}

async function create({ brandId, defaultName, description, sku, isActive }) {
  return prisma.menuItem.create({
    data: { brandId, defaultName, description, sku: sku || null, isActive },
  });
}

async function get(id, { brandId }) {
  const item = await prisma.menuItem.findFirst({
    where: { id, brandId },
    include: {
      i18n: true,
      variants: {
        include: {
          recipes: {
            include: {
              lines: {
                include: {
                  product: {
                    select: { id: true, name: true, unit: true }
                  }
                }
              }
            }
          }
        }
      },
      categories: { include: { category: true } },
      modifierLinks: { include: { group: { include: { options: true } } } },
      recipes: {
        include: {
          lines: {
            include: {
              product: {
                select: { id: true, name: true, unit: true }
              }
            }
          }
        }
      },
    },
  });
  if (!item) throw new Error("Item not found");
  return item;
}

async function update(id, { brandId, ...data }) {
  const existing = await prisma.menuItem.findFirst({ where: { id, brandId } });
  if (!existing) throw new Error("Item not found");
  if (data.sku === "") data.sku = null;
  return prisma.menuItem.update({ where: { id }, data });
}

async function remove(id, { brandId }) {
  const existing = await prisma.menuItem.findFirst({ where: { id, brandId } });
  if (!existing) throw new Error("Item not found");
  await prisma.itemCategory.deleteMany({ where: { itemId: id } });
  await prisma.itemModifierGroup.deleteMany({ where: { itemId: id } });
  await prisma.menuItemI18n.deleteMany({ where: { itemId: id } });
  const variants = await prisma.itemVariant.findMany({ where: { itemId: id } });
  const variantIds = variants.map((v) => v.id);
  if (variantIds.length) {
    await prisma.itemVariantModifierGroup.deleteMany({
      where: { variantId: { in: variantIds } },
    });
    await prisma.branchItemVariant.deleteMany({
      where: { variantId: { in: variantIds } },
    });
  }
  await prisma.itemVariant.deleteMany({ where: { itemId: id } });
  await prisma.menuItem.delete({ where: { id } });
}

async function attachCategories(itemId, { brandId, categoryIds }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  const cats = await prisma.menuCategory.findMany({
    where: { id: { in: categoryIds }, brandId },
  });
  if (cats.length !== categoryIds.length)
    throw new Error("Some categories not found in brand");

  // replace all
  await prisma.itemCategory.deleteMany({ where: { itemId } });
  const data = categoryIds.map((categoryId) => ({ itemId, categoryId }));
  await prisma.itemCategory.createMany({ data, skipDuplicates: true });

  return prisma.itemCategory.findMany({
    where: { itemId },
    include: { category: true },
  });
}

async function listCategories(itemId, { brandId }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  return prisma.itemCategory.findMany({
    where: { itemId },
    include: { category: true },
  });
}

async function detachCategory(itemId, categoryId, { brandId }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  await prisma.itemCategory.delete({
    where: { itemId_categoryId: { itemId, categoryId } },
  });
}

// i18n
async function upsertI18n(itemId, { brandId, locale, name, description }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  return prisma.menuItemI18n.upsert({
    where: { itemId_locale: { itemId, locale } },
    update: { name, description: description || null },
    create: { itemId, locale, name, description: description || null },
  });
}

async function getI18n(itemId, { brandId }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  return prisma.menuItemI18n.findMany({ where: { itemId } });
}

async function deleteI18n(itemId, locale, { brandId }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  await prisma.menuItemI18n.delete({
    where: { itemId_locale: { itemId, locale } },
  });
}

// link modifier groups to item
async function linkModifierGroups(itemId, { brandId, groupIds, required }) {
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, brandId },
  });
  if (!item) throw new Error("Item not found");
  const groups = await prisma.modifierGroup.findMany({
    where: { id: { in: groupIds }, brandId },
  });
  if (groups.length !== groupIds.length)
    throw new Error("Some modifier groups not found in brand");

  await prisma.itemModifierGroup.deleteMany({ where: { itemId } });
  await prisma.itemModifierGroup.createMany({
    data: groupIds.map((gid) => ({
      itemId,
      groupId: gid,
      required: !!required,
    })),
    skipDuplicates: true,
  });

  return prisma.itemModifierGroup.findMany({
    where: { itemId },
    include: { group: { include: { options: true } } },
  });
}

module.exports = {
  list,
  create,
  get,
  update,
  remove,
  attachCategories,
  listCategories,
  detachCategory,
  upsertI18n,
  getI18n,
  deleteI18n,
  linkModifierGroups,
};
