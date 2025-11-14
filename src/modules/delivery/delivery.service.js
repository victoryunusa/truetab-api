const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * List all available delivery providers
 */
async function listProviders() {
  const providers = await prisma.deliveryProvider.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return providers;
}

/**
 * Create a delivery integration
 */
async function createIntegration(brandId, data) {
  // Verify provider exists
  const provider = await prisma.deliveryProvider.findUnique({
    where: { id: data.providerId },
  });

  if (!provider) {
    throw new Error("Provider not found");
  }

  // Check if integration already exists
  const existing = await prisma.deliveryIntegration.findUnique({
    where: {
      brandId_providerId: {
        brandId,
        providerId: data.providerId,
      },
    },
  });

  if (existing) {
    throw new Error("Integration already exists for this provider");
  }

  // Create integration
  const integration = await prisma.deliveryIntegration.create({
    data: {
      brandId,
      branchId: data.branchId,
      providerId: data.providerId,
      credentials: data.credentials, // Should be encrypted in production
      settings: data.settings || {},
      isEnabled: true,
    },
    include: {
      provider: true,
    },
  });

  return integration;
}

/**
 * List integrations for a brand
 */
async function listIntegrations(brandId) {
  const integrations = await prisma.deliveryIntegration.findMany({
    where: { brandId },
    include: {
      provider: true,
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return integrations;
}

/**
 * Get integration by ID
 */
async function getIntegrationById(integrationId, brandId) {
  const integration = await prisma.deliveryIntegration.findFirst({
    where: { id: integrationId, brandId },
    include: {
      provider: true,
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  return integration;
}

/**
 * Update integration
 */
async function updateIntegration(integrationId, brandId, data) {
  const integration = await prisma.deliveryIntegration.findFirst({
    where: { id: integrationId, brandId },
  });

  if (!integration) {
    throw new Error("Integration not found");
  }

  const updated = await prisma.deliveryIntegration.update({
    where: { id: integrationId },
    data: {
      ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
      ...(data.credentials && { credentials: data.credentials }),
      ...(data.settings && { settings: data.settings }),
      lastSyncAt: new Date(),
    },
    include: {
      provider: true,
    },
  });

  return updated;
}

/**
 * Delete integration
 */
async function deleteIntegration(integrationId, brandId) {
  const integration = await prisma.deliveryIntegration.findFirst({
    where: { id: integrationId, brandId },
  });

  if (!integration) {
    throw new Error("Integration not found");
  }

  await prisma.deliveryIntegration.delete({
    where: { id: integrationId },
  });

  return { success: true };
}

/**
 * Process incoming webhook order from delivery provider
 */
async function processWebhookOrder(integrationId, webhookData) {
  const integration = await prisma.deliveryIntegration.findUnique({
    where: { id: integrationId },
    include: {
      provider: true,
      brand: true,
    },
  });

  if (!integration) {
    throw new Error("Integration not found");
  }

  if (!integration.isEnabled) {
    throw new Error("Integration is disabled");
  }

  // Extract order data from webhook
  const {
    externalOrderId,
    customerName,
    customerPhone,
    deliveryAddress,
    items,
    subtotal,
    deliveryFee,
    serviceFee = 0,
    tip = 0,
    tax = 0,
    total,
    estimatedPickup,
    estimatedDelivery,
  } = webhookData;

  // Create internal order
  const order = await prisma.$transaction(async (tx) => {
    // Create order in orders table
    const newOrder = await tx.order.create({
      data: {
        brandId: integration.brandId,
        branchId: integration.branchId || integration.brand.branches[0]?.id,
        type: "DELIVERY",
        status: "CONFIRMED",
        isOnlineOrder: true,
        customerName,
        customerPhone,
        customerEmail: webhookData.customerEmail,
        deliveryAddress,
        subtotal,
        deliveryFee,
        tax,
        tip,
        total,
        paymentStatus: "PENDING",
        paymentMethod: webhookData.paymentMethod || "DELIVERY_PLATFORM",
      },
    });

    // Create delivery order record
    const deliveryOrder = await tx.deliveryOrder.create({
      data: {
        integrationId,
        orderId: newOrder.id,
        externalOrderId,
        provider: integration.provider.name,
        status: "CONFIRMED",
        customerName,
        customerPhone,
        deliveryAddress,
        items,
        subtotal,
        deliveryFee,
        serviceFee,
        tip,
        tax,
        total,
        estimatedPickup,
        estimatedDelivery,
        rawData: webhookData,
      },
    });

    return { order: newOrder, deliveryOrder };
  });

  return order;
}

/**
 * List delivery orders
 */
async function listDeliveryOrders(brandId, options = {}) {
  const { page = 1, limit = 20, status, provider } = options;
  const skip = (page - 1) * limit;

  const where = {
    integration: { brandId },
    ...(status && { status }),
    ...(provider && { provider }),
  };

  const [orders, total] = await Promise.all([
    prisma.deliveryOrder.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
          },
        },
        integration: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deliveryOrder.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get delivery order by ID
 */
async function getDeliveryOrderById(deliveryOrderId, brandId) {
  const deliveryOrder = await prisma.deliveryOrder.findFirst({
    where: {
      id: deliveryOrderId,
      integration: { brandId },
    },
    include: {
      order: true,
      integration: {
        include: {
          provider: true,
        },
      },
    },
  });

  return deliveryOrder;
}

/**
 * Update delivery order status
 */
async function updateDeliveryOrderStatus(deliveryOrderId, brandId, status) {
  const deliveryOrder = await prisma.deliveryOrder.findFirst({
    where: {
      id: deliveryOrderId,
      integration: { brandId },
    },
  });

  if (!deliveryOrder) {
    throw new Error("Delivery order not found");
  }

  const updateData = {
    status,
  };

  // Track timestamps
  const now = new Date();
  if (status === "PICKED_UP" && !deliveryOrder.actualPickup) {
    updateData.actualPickup = now;
  }
  if (status === "DELIVERED" && !deliveryOrder.actualDelivery) {
    updateData.actualDelivery = now;
  }

  const updated = await prisma.deliveryOrder.update({
    where: { id: deliveryOrderId },
    data: updateData,
  });

  // TODO: Sync status back to delivery provider API
  // await syncStatusToProvider(deliveryOrder.integration, updated);

  return updated;
}

/**
 * Get delivery metrics
 */
async function getDeliveryMetrics(brandId, dateRange = {}) {
  const { startDate, endDate } = dateRange;

  const where = {
    integration: { brandId },
    ...(startDate && { createdAt: { gte: new Date(startDate) } }),
    ...(endDate && { createdAt: { lte: new Date(endDate) } }),
  };

  const [totalOrders, ordersByProvider, totalRevenue, avgDeliveryTime] = await Promise.all([
    prisma.deliveryOrder.count({ where }),

    prisma.deliveryOrder.groupBy({
      by: ["provider"],
      where,
      _count: true,
    }),

    prisma.deliveryOrder.aggregate({
      where,
      _sum: {
        total: true,
        commission: true,
      },
    }),

    prisma.deliveryOrder.aggregate({
      where: {
        ...where,
        actualPickup: { not: null },
        actualDelivery: { not: null },
      },
      _avg: {
        // This would require a computed field in real implementation
        // For now, just return null
      },
    }),
  ]);

  return {
    totalOrders,
    ordersByProvider,
    totalRevenue: totalRevenue._sum.total || 0,
    totalCommission: totalRevenue._sum.commission || 0,
    netRevenue: (totalRevenue._sum.total || 0) - (totalRevenue._sum.commission || 0),
  };
}

module.exports = {
  listProviders,
  createIntegration,
  listIntegrations,
  getIntegrationById,
  updateIntegration,
  deleteIntegration,
  processWebhookOrder,
  listDeliveryOrders,
  getDeliveryOrderById,
  updateDeliveryOrderStatus,
  getDeliveryMetrics,
};
