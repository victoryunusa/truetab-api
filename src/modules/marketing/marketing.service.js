const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Create a new marketing campaign
 */
async function createCampaign(brandId, data) {
  const campaign = await prisma.campaign.create({
    data: {
      brandId,
      name: data.name,
      description: data.description,
      type: data.type,
      channel: data.channel,
      status: "DRAFT",
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      targetAudience: data.targetAudience || {},
      content: data.content,
      imageUrl: data.imageUrl,
      callToAction: data.callToAction,
      link: data.link,
      promoCode: data.promoCode,
    },
    include: {
      metrics: true,
    },
  });

  // Initialize metrics
  await prisma.campaignMetrics.create({
    data: {
      campaignId: campaign.id,
    },
  });

  return campaign;
}

/**
 * List campaigns with filtering and pagination
 */
async function listCampaigns(brandId, options = {}) {
  const { page = 1, limit = 20, status, type, channel } = options;
  const skip = (page - 1) * limit;

  const where = {
    brandId,
    ...(status && { status }),
    ...(type && { type }),
    ...(channel && { channel }),
  };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        metrics: true,
        _count: {
          select: {
            audiences: true,
            engagements: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ]);

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get campaign by ID
 */
async function getCampaignById(campaignId, brandId) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
    include: {
      metrics: true,
      _count: {
        select: {
          audiences: true,
          engagements: true,
        },
      },
    },
  });

  return campaign;
}

/**
 * Update a campaign
 */
async function updateCampaign(campaignId, brandId, data) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Prevent editing if campaign is active or completed
  if (campaign.status === "ACTIVE" && data.content) {
    throw new Error("Cannot edit content of an active campaign");
  }

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type && { type: data.type }),
      ...(data.channel && { channel: data.channel }),
      ...(data.status && { status: data.status }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.targetAudience && { targetAudience: data.targetAudience }),
      ...(data.content && { content: data.content }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      ...(data.callToAction !== undefined && { callToAction: data.callToAction }),
      ...(data.link !== undefined && { link: data.link }),
      ...(data.promoCode !== undefined && { promoCode: data.promoCode }),
    },
    include: {
      metrics: true,
    },
  });

  return updated;
}

/**
 * Delete a campaign
 */
async function deleteCampaign(campaignId, brandId) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.status === "ACTIVE") {
    throw new Error("Cannot delete an active campaign. Pause it first.");
  }

  await prisma.campaign.delete({
    where: { id: campaignId },
  });

  return { success: true };
}

/**
 * Add audience to campaign
 */
async function addAudienceToCampaign(campaignId, brandId, audienceData) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const audiences = [];

  // Add by customer IDs
  if (audienceData.customers && audienceData.customers.length > 0) {
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: audienceData.customers },
        brandId,
      },
      select: { id: true, email: true, phone: true },
    });

    for (const customer of customers) {
      audiences.push({
        campaignId,
        customerId: customer.id,
        email: customer.email,
        phone: customer.phone,
        segmentCriteria: { type: "direct" },
      });
    }
  }

  // Add by segment criteria
  if (audienceData.segments) {
    const segmentCustomers = await findCustomersBySegment(brandId, audienceData.segments);
    for (const customer of segmentCustomers) {
      audiences.push({
        campaignId,
        customerId: customer.id,
        email: customer.email,
        phone: customer.phone,
        segmentCriteria: audienceData.segments,
      });
    }
  }

  // Add by emails (may not be existing customers)
  if (audienceData.emails && audienceData.emails.length > 0) {
    for (const email of audienceData.emails) {
      audiences.push({
        campaignId,
        email,
        segmentCriteria: { type: "email_list" },
      });
    }
  }

  // Add by phones
  if (audienceData.phones && audienceData.phones.length > 0) {
    for (const phone of audienceData.phones) {
      audiences.push({
        campaignId,
        phone,
        segmentCriteria: { type: "phone_list" },
      });
    }
  }

  // Bulk create audiences
  const created = await prisma.campaignAudience.createMany({
    data: audiences,
    skipDuplicates: true,
  });

  return { added: created.count };
}

/**
 * Find customers by segment criteria
 */
async function findCustomersBySegment(brandId, segments) {
  const where = { brandId };

  // Build query based on segment criteria
  if (segments.newCustomers) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    where.createdAt = { gte: thirtyDaysAgo };
  }

  // For advanced segmentation (loyalty tier, spending, etc.),
  // you would need to join with orders and loyalty tables
  // This is a simplified version

  const customers = await prisma.customer.findMany({
    where,
    select: { id: true, email: true, phone: true },
  });

  return customers;
}

/**
 * Track campaign engagement event
 */
async function trackEngagement(campaignId, brandId, eventData) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Find customer if provided
  let customerId = eventData.customerId;
  if (!customerId && eventData.email) {
    const customer = await prisma.customer.findFirst({
      where: { email: eventData.email, brandId },
      select: { id: true },
    });
    customerId = customer?.id;
  }

  // Create engagement record
  const engagement = await prisma.campaignEngagement.create({
    data: {
      campaignId,
      customerId,
      email: eventData.email,
      eventType: eventData.eventType,
      eventData: eventData.eventData || {},
      ipAddress: eventData.ipAddress,
      userAgent: eventData.userAgent,
    },
  });

  // Update campaign metrics
  await updateCampaignMetrics(campaignId, eventData.eventType);

  // Update audience record if exists
  if (eventData.email) {
    const updateData = {};
    switch (eventData.eventType) {
      case "DELIVERED":
        updateData.deliveredAt = new Date();
        break;
      case "OPENED":
        updateData.openedAt = new Date();
        break;
      case "CLICKED":
        updateData.clickedAt = new Date();
        break;
      case "CONVERTED":
        updateData.convertedAt = new Date();
        break;
      case "UNSUBSCRIBED":
        updateData.unsubscribedAt = new Date();
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.campaignAudience.updateMany({
        where: {
          campaignId,
          email: eventData.email,
        },
        data: updateData,
      });
    }
  }

  return engagement;
}

/**
 * Update campaign metrics based on event
 */
async function updateCampaignMetrics(campaignId, eventType) {
  const metrics = await prisma.campaignMetrics.findUnique({
    where: { campaignId },
  });

  if (!metrics) return;

  const updates = {};
  switch (eventType) {
    case "SENT":
      updates.totalSent = metrics.totalSent + 1;
      break;
    case "DELIVERED":
      updates.totalDelivered = metrics.totalDelivered + 1;
      break;
    case "OPENED":
      updates.totalOpened = metrics.totalOpened + 1;
      break;
    case "CLICKED":
      updates.totalClicked = metrics.totalClicked + 1;
      break;
    case "CONVERTED":
      updates.totalConverted = metrics.totalConverted + 1;
      break;
    case "UNSUBSCRIBED":
      updates.totalUnsubscribed = metrics.totalUnsubscribed + 1;
      break;
  }

  await prisma.campaignMetrics.update({
    where: { campaignId },
    data: updates,
  });
}

/**
 * Get campaign analytics/metrics
 */
async function getCampaignAnalytics(campaignId, brandId) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
    include: {
      metrics: true,
      _count: {
        select: {
          audiences: true,
        },
      },
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const metrics = campaign.metrics;

  // Calculate rates
  const openRate = metrics.totalDelivered > 0 
    ? (metrics.totalOpened / metrics.totalDelivered) * 100 
    : 0;
  const clickRate = metrics.totalOpened > 0 
    ? (metrics.totalClicked / metrics.totalOpened) * 100 
    : 0;
  const conversionRate = metrics.totalClicked > 0 
    ? (metrics.totalConverted / metrics.totalClicked) * 100 
    : 0;

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      channel: campaign.channel,
      status: campaign.status,
    },
    metrics: {
      totalAudience: campaign._count.audiences,
      totalSent: metrics.totalSent,
      totalDelivered: metrics.totalDelivered,
      totalOpened: metrics.totalOpened,
      totalClicked: metrics.totalClicked,
      totalConverted: metrics.totalConverted,
      totalUnsubscribed: metrics.totalUnsubscribed,
      totalRevenue: metrics.totalRevenue,
      openRate: openRate.toFixed(2),
      clickRate: clickRate.toFixed(2),
      conversionRate: conversionRate.toFixed(2),
      roi: metrics.roi,
    },
  };
}

/**
 * Get campaign audience list
 */
async function getCampaignAudience(campaignId, brandId, options = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, brandId },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const [audiences, total] = await Promise.all([
    prisma.campaignAudience.findMany({
      where: { campaignId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.campaignAudience.count({ where: { campaignId } }),
  ]);

  return {
    audiences,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = {
  createCampaign,
  listCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  addAudienceToCampaign,
  trackEngagement,
  getCampaignAnalytics,
  getCampaignAudience,
};
