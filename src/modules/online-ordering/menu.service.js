const prisma = require("../../lib/prisma");
const QRCode = require("qrcode");
const { nanoid } = require("nanoid");

/**
 * Create or update online menu for a brand/branch
 */
async function createOnlineMenu({ brandId, branchId = null, settings = {} }) {
  // Check if menu already exists
  const existing = await prisma.onlineMenu.findFirst({
    where: {
      brandId,
      branchId,
    },
  });

  if (existing) {
    return existing;
  }

  // Get brand info for slug generation
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { name: true },
  });

  // Generate unique URL slug
  const slugBase = brand.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const uniqueId = nanoid(8);
  const urlSlug = `${slugBase}-${uniqueId}`;

  // Generate menu URL
  const baseUrl = process.env.ONLINE_MENU_BASE_URL || "https://order.truetab.com";
  const menuUrl = `${baseUrl}/menu/${urlSlug}`;

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 500,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // Create online menu
  const onlineMenu = await prisma.onlineMenu.create({
    data: {
      brandId,
      branchId,
      urlSlug,
      qrCode: qrCodeDataUrl,
      settings: settings || {},
      isActive: true,
    },
    include: {
      brand: {
        select: {
          name: true,
          email: true,
          currency: true,
        },
      },
    },
  });

  return {
    ...onlineMenu,
    menuUrl,
  };
}

/**
 * Get public menu by URL slug
 */
async function getPublicMenu(urlSlug) {
  const menu = await prisma.onlineMenu.findUnique({
    where: { urlSlug },
    include: {
      brand: {
        select: {
          id: true,
          name: true,
          currency: true,
        },
      },
    },
  });

  if (!menu || !menu.isActive) {
    return null;
  }

  // Get menu items for the brand
  const items = await prisma.menuItem.findMany({
    where: {
      brandId: menu.brandId,
      isActive: true,
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      variants: {
        where: { isActive: true },
        include: {
          branchOverrides: menu.branchId
            ? {
                where: { branchId: menu.branchId },
              }
            : false,
        },
      },
      modifierLinks: {
        include: {
          group: {
            include: {
              options: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  });

  // Group items by category
  const categories = await prisma.menuCategory.findMany({
    where: {
      brandId: menu.brandId,
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const categorizedMenu = categories.map((category) => ({
    ...category,
    items: items.filter((item) =>
      item.categories.some((cat) => cat.categoryId === category.id)
    ),
  }));

  return {
    menu: {
      id: menu.id,
      urlSlug: menu.urlSlug,
      settings: menu.settings,
    },
    brand: menu.brand,
    categories: categorizedMenu,
  };
}

/**
 * Update online menu settings
 */
async function updateMenuSettings(menuId, settings) {
  return prisma.onlineMenu.update({
    where: { id: menuId },
    data: { settings },
  });
}

/**
 * Toggle online menu active status
 */
async function toggleMenuStatus(menuId, isActive) {
  return prisma.onlineMenu.update({
    where: { id: menuId },
    data: { isActive },
  });
}

/**
 * Get online menu for a brand
 */
async function getBrandOnlineMenu(brandId, branchId = null) {
  const menu = await prisma.onlineMenu.findFirst({
    where: {
      brandId,
      branchId,
    },
    include: {
      brand: {
        select: {
          name: true,
          currency: true,
        },
      },
    },
  });

  if (!menu) {
    return null;
  }

  const baseUrl = process.env.ONLINE_MENU_BASE_URL || "https://order.truetab.com";
  const menuUrl = `${baseUrl}/menu/${menu.urlSlug}`;

  return {
    ...menu,
    menuUrl,
  };
}

/**
 * Regenerate QR code for menu
 */
async function regenerateQRCode(menuId) {
  const menu = await prisma.onlineMenu.findUnique({
    where: { id: menuId },
  });

  if (!menu) {
    throw new Error("Menu not found");
  }

  const baseUrl = process.env.ONLINE_MENU_BASE_URL || "https://order.truetab.com";
  const menuUrl = `${baseUrl}/menu/${menu.urlSlug}`;

  const qrCodeDataUrl = await QRCode.toDataURL(menuUrl, {
    width: 500,
    margin: 2,
  });

  return prisma.onlineMenu.update({
    where: { id: menuId },
    data: { qrCode: qrCodeDataUrl },
  });
}

module.exports = {
  createOnlineMenu,
  getPublicMenu,
  updateMenuSettings,
  toggleMenuStatus,
  getBrandOnlineMenu,
  regenerateQRCode,
};
