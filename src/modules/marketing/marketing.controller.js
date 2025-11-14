const svc = require("./marketing.service");
const {
  createCampaignSchema,
  updateCampaignSchema,
  addAudienceSchema,
  trackEngagementSchema,
} = require("./marketing.validation");

/**
 * Create a new campaign
 */
async function createCampaign(req, res, next) {
  try {
    const { value, error } = createCampaignSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const campaign = await svc.createCampaign(req.tenant.brandId, value);
    res.status(201).json({ data: campaign });
  } catch (err) {
    next(err);
  }
}

/**
 * List all campaigns for a brand
 */
async function listCampaigns(req, res, next) {
  try {
    const { page, limit, status, type, channel } = req.query;
    const result = await svc.listCampaigns(req.tenant.brandId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      type,
      channel,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a specific campaign
 */
async function getCampaign(req, res, next) {
  try {
    const campaign = await svc.getCampaignById(
      req.params.id,
      req.tenant.brandId
    );
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ data: campaign });
  } catch (err) {
    next(err);
  }
}

/**
 * Update a campaign
 */
async function updateCampaign(req, res, next) {
  try {
    const { value, error } = updateCampaignSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const campaign = await svc.updateCampaign(
      req.params.id,
      req.tenant.brandId,
      value
    );
    res.json({ data: campaign });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a campaign
 */
async function deleteCampaign(req, res, next) {
  try {
    await svc.deleteCampaign(req.params.id, req.tenant.brandId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Add audience to a campaign
 */
async function addAudience(req, res, next) {
  try {
    const { value, error } = addAudienceSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const result = await svc.addAudienceToCampaign(
      req.params.id,
      req.tenant.brandId,
      value
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Get campaign audience
 */
async function getCampaignAudience(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await svc.getCampaignAudience(
      req.params.id,
      req.tenant.brandId,
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
      }
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * Track campaign engagement
 */
async function trackEngagement(req, res, next) {
  try {
    const { value, error } = trackEngagementSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    }

    const engagement = await svc.trackEngagement(
      req.params.id,
      req.tenant.brandId,
      value
    );
    res.json({ data: engagement });
  } catch (err) {
    next(err);
  }
}

/**
 * Get campaign analytics
 */
async function getCampaignAnalytics(req, res, next) {
  try {
    const analytics = await svc.getCampaignAnalytics(
      req.params.id,
      req.tenant.brandId
    );
    res.json({ data: analytics });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  addAudience,
  getCampaignAudience,
  trackEngagement,
  getCampaignAnalytics,
};
