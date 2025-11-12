const menuService = require("./menu.service");

/**
 * Get public menu by URL slug (no auth required)
 */
async function getPublicMenu(req, res, next) {
  try {
    const { urlSlug } = req.params;
    
    const menu = await menuService.getPublicMenu(urlSlug);
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found or inactive",
      });
    }
    
    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create online menu with QR code
 */
async function createMenu(req, res, next) {
  try {
    const { brandId } = req.user;
    const { branchId, settings } = req.body;
    
    const menu = await menuService.createOnlineMenu({
      brandId,
      branchId,
      settings,
    });
    
    res.status(201).json({
      success: true,
      data: menu,
      message: "Online menu created successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get brand's online menu
 */
async function getBrandMenu(req, res, next) {
  try {
    const { brandId } = req.params;
    const { branchId } = req.query;
    
    // Verify user has access to this brand
    if (req.user.brandId !== brandId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    
    const menu = await menuService.getBrandOnlineMenu(brandId, branchId);
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Online menu not found",
      });
    }
    
    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update menu settings
 */
async function updateSettings(req, res, next) {
  try {
    const { menuId } = req.params;
    const { settings } = req.body;
    
    const menu = await menuService.updateMenuSettings(menuId, settings);
    
    res.json({
      success: true,
      data: menu,
      message: "Menu settings updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Regenerate QR code
 */
async function regenerateQR(req, res, next) {
  try {
    const { menuId } = req.params;
    
    const menu = await menuService.regenerateQRCode(menuId);
    
    res.json({
      success: true,
      data: menu,
      message: "QR code regenerated successfully",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle menu active status
 */
async function toggleStatus(req, res, next) {
  try {
    const { menuId } = req.params;
    const { isActive } = req.body;
    
    const menu = await menuService.toggleMenuStatus(menuId, isActive);
    
    res.json({
      success: true,
      data: menu,
      message: `Menu ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicMenu,
  createMenu,
  getBrandMenu,
  updateSettings,
  regenerateQR,
  toggleStatus,
};
