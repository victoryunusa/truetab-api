const { getSettings, updateSettings, resetSettings } = require('./settings.service');
const { updateSettingsSchema } = require('./settings.validation');

/**
 * Get settings for current brand/branch
 */
async function getSettingsController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }
    
    const settings = await getSettings(brandId, branchId);
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

/**
 * Update settings for current brand/branch
 */
async function updateSettingsController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }
    
    const { value, error } = updateSettingsSchema.validate(req.body, {
      abortEarly: false,
    });
    
    if (error) {
      return res.status(400).json({ 
        error: error.details.map(d => d.message) 
      });
    }
    
    const settings = await updateSettings(brandId, branchId, value);
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettingsController(req, res) {
  try {
    const brandId = req.headers['x-brand-id'];
    const branchId = req.headers['x-branch-id'] || null;
    
    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }
    
    const settings = await resetSettings(brandId, branchId);
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Reset settings error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

module.exports = {
  getSettingsController,
  updateSettingsController,
  resetSettingsController,
};
