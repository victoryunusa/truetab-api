const { prisma } = require('../../lib/prisma');

/**
 * Get default settings structure
 */
function getDefaultSettings() {
  return {
    businessHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '22:00', closed: false },
    },
    paymentSettings: {
      defaultGateway: 'stripe',
      allowCash: true,
      allowCard: true,
      allowMobile: true,
    },
    receiptSettings: {
      showLogo: true,
      footerText: 'Thank you for your business!',
      showTax: true,
      showTip: true,
    },
    orderSettings: {
      autoAccept: false,
      prepTime: 15,
      maxFutureOrders: 7,
      allowSpecialInstructions: true,
    },
    notifications: {
      emailOrders: true,
      smsOrders: false,
      pushOrders: true,
      dailyReport: false,
      weeklyReport: false,
    },
    taxSettings: {
      includeTax: false,
      defaultTaxRate: 0,
    },
    features: {
      onlineOrdering: true,
      reservations: true,
      loyalty: true,
      giftCards: true,
      reviews: true,
    },
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  };
}

/**
 * Get settings for a brand or branch
 */
async function getSettings(brandId, branchId = null) {
  try {
    let settings;
    
    if (branchId) {
      settings = await prisma.settings.findUnique({
        where: { branchId },
      });
    }
    
    if (!settings) {
      settings = await prisma.settings.findUnique({
        where: { brandId },
      });
    }
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaults = getDefaultSettings();
      settings = await prisma.settings.create({
        data: {
          brandId,
          branchId,
          ...defaults,
        },
      });
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw new Error('Failed to retrieve settings');
  }
}

/**
 * Update settings for a brand or branch
 */
async function updateSettings(brandId, branchId = null, updates) {
  try {
    let settings;
    
    // Find existing settings
    if (branchId) {
      settings = await prisma.settings.findUnique({
        where: { branchId },
      });
    }
    
    if (!settings) {
      settings = await prisma.settings.findUnique({
        where: { brandId },
      });
    }
    
    // If settings exist, update them
    if (settings) {
      const updated = await prisma.settings.update({
        where: { id: settings.id },
        data: updates,
      });
      return updated;
    }
    
    // Otherwise, create new settings with updates
    const defaults = getDefaultSettings();
    const newSettings = await prisma.settings.create({
      data: {
        brandId,
        branchId,
        ...defaults,
        ...updates,
      },
    });
    
    return newSettings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to update settings');
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings(brandId, branchId = null) {
  try {
    let settings;
    
    if (branchId) {
      settings = await prisma.settings.findUnique({
        where: { branchId },
      });
    }
    
    if (!settings) {
      settings = await prisma.settings.findUnique({
        where: { brandId },
      });
    }
    
    if (!settings) {
      throw new Error('Settings not found');
    }
    
    const defaults = getDefaultSettings();
    const reset = await prisma.settings.update({
      where: { id: settings.id },
      data: defaults,
    });
    
    return reset;
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw new Error('Failed to reset settings');
  }
}

module.exports = {
  getSettings,
  updateSettings,
  resetSettings,
  getDefaultSettings,
};
