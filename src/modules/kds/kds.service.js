const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * List active tickets for a station or branch
 */
async function listTickets(brandId, branchId, options = {}) {
  const { stationId, status, priority } = options;

  const where = {
    brandId,
    branchId,
    ...(stationId && { stationId }),
    ...(status && { status }),
    ...(priority !== undefined && { priority: { gte: priority } }),
  };

  const tickets = await prisma.kitchenTicket.findMany({
    where,
    include: {
      items: {
        include: {
          orderItem: {
            include: {
              item: {
                select: {
                  defaultName: true,
                },
              },
              variant: {
                select: {
                  name: true,
                },
              },
              modifiers: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          type: true,
          createdAt: true,
        },
      },
      station: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { priority: "desc" }, // Higher priority first
      { createdAt: "asc" }, // Then oldest first (FIFO)
    ],
  });

  return tickets;
}

/**
 * Get ticket by ID
 */
async function getTicketById(ticketId, brandId) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
    include: {
      items: {
        include: {
          orderItem: {
            include: {
              item: true,
              variant: true,
              modifiers: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          type: true,
          customerId: true,
          createdAt: true,
        },
      },
      station: true,
    },
  });

  return ticket;
}

/**
 * Accept a ticket (kitchen acknowledges)
 */
async function acceptTicket(ticketId, brandId) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== "NEW") {
    throw new Error(`Ticket is already ${ticket.status}`);
  }

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  return updated;
}

/**
 * Start preparing a ticket
 */
async function startTicket(ticketId, brandId) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (!["NEW", "ACCEPTED"].includes(ticket.status)) {
    throw new Error(`Cannot start ticket with status ${ticket.status}`);
  }

  const now = new Date();
  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: {
      status: "PREPARING",
      startedAt: now,
      ...(ticket.status === "NEW" && { acceptedAt: now }), // Auto-accept if starting directly
    },
  });

  return updated;
}

/**
 * Mark ticket as ready
 */
async function markReady(ticketId, brandId) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== "PREPARING") {
    throw new Error(`Cannot mark ready from status ${ticket.status}`);
  }

  const now = new Date();
  
  // Calculate actual prep time if started
  let actualPrepTime = null;
  if (ticket.startedAt) {
    const diffMs = now - ticket.startedAt;
    actualPrepTime = Math.round(diffMs / 60000); // Convert to minutes
  }

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: {
      status: "READY",
      readyAt: now,
      actualPrepTime,
    },
  });

  return updated;
}

/**
 * Mark ticket as served
 */
async function markServed(ticketId, brandId) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status !== "READY") {
    throw new Error(`Cannot mark served from status ${ticket.status}`);
  }

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: {
      status: "SERVED",
      servedAt: new Date(),
    },
  });

  return updated;
}

/**
 * Bump ticket (complete and clear from display)
 */
async function bumpTicket(ticketId, brandId) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const now = new Date();
  
  // Calculate actual prep time if not already calculated
  let actualPrepTime = ticket.actualPrepTime;
  if (!actualPrepTime && ticket.startedAt) {
    const diffMs = now - ticket.startedAt;
    actualPrepTime = Math.round(diffMs / 60000);
  }

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: {
      status: ticket.status === "SERVED" ? "SERVED" : "READY",
      bumpedAt: now,
      actualPrepTime,
    },
  });

  return updated;
}

/**
 * Void ticket
 */
async function voidTicket(ticketId, brandId, reason) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: {
      status: "VOIDED",
      delayReason: reason,
      bumpedAt: new Date(),
    },
  });

  return updated;
}

/**
 * Set ticket priority
 */
async function setPriority(ticketId, brandId, priority) {
  const ticket = await prisma.kitchenTicket.findFirst({
    where: { id: ticketId, brandId },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  const updated = await prisma.kitchenTicket.update({
    where: { id: ticketId },
    data: { priority },
  });

  return updated;
}

/**
 * Get performance metrics for a station
 */
async function getStationMetrics(stationId, brandId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  
  const where = {
    stationId,
    brandId,
    status: { in: ["READY", "SERVED"] }, // Only completed tickets
    ...(startDate && { createdAt: { gte: new Date(startDate) } }),
    ...(endDate && { createdAt: { lte: new Date(endDate) } }),
  };

  // Get all tickets
  const tickets = await prisma.kitchenTicket.findMany({
    where,
    select: {
      actualPrepTime: true,
      estimatedTime: true,
      createdAt: true,
      readyAt: true,
      priority: true,
    },
  });

  if (tickets.length === 0) {
    return {
      totalTickets: 0,
      averagePrepTime: 0,
      averageEstimatedTime: 0,
      onTimeRate: 0,
      ticketsOnTime: 0,
      ticketsLate: 0,
    };
  }

  // Calculate metrics
  const totalTickets = tickets.length;
  const ticketsWithActual = tickets.filter((t) => t.actualPrepTime);
  const ticketsWithEstimate = tickets.filter((t) => t.estimatedTime);

  const avgActualPrepTime = ticketsWithActual.length > 0
    ? ticketsWithActual.reduce((sum, t) => sum + t.actualPrepTime, 0) / ticketsWithActual.length
    : 0;

  const avgEstimatedTime = ticketsWithEstimate.length > 0
    ? ticketsWithEstimate.reduce((sum, t) => sum + t.estimatedTime, 0) / ticketsWithEstimate.length
    : 0;

  // On-time calculation (actual <= estimated)
  const ticketsWithBoth = tickets.filter((t) => t.actualPrepTime && t.estimatedTime);
  const ticketsOnTime = ticketsWithBoth.filter((t) => t.actualPrepTime <= t.estimatedTime).length;
  const ticketsLate = ticketsWithBoth.length - ticketsOnTime;
  const onTimeRate = ticketsWithBoth.length > 0
    ? (ticketsOnTime / ticketsWithBoth.length) * 100
    : 0;

  return {
    totalTickets,
    averagePrepTime: Math.round(avgActualPrepTime),
    averageEstimatedTime: Math.round(avgEstimatedTime),
    onTimeRate: onTimeRate.toFixed(2),
    ticketsOnTime,
    ticketsLate,
    ticketsWithMetrics: ticketsWithBoth.length,
  };
}

/**
 * Get overall metrics for a branch
 */
async function getBranchMetrics(branchId, brandId, dateRange = {}) {
  const { startDate, endDate } = dateRange;

  const where = {
    branchId,
    brandId,
    status: { in: ["READY", "SERVED"] },
    ...(startDate && { createdAt: { gte: new Date(startDate) } }),
    ...(endDate && { createdAt: { lte: new Date(endDate) } }),
  };

  const [totalTickets, tickets, stationBreakdown] = await Promise.all([
    prisma.kitchenTicket.count({ where }),
    
    prisma.kitchenTicket.findMany({
      where,
      select: {
        actualPrepTime: true,
        estimatedTime: true,
        stationId: true,
      },
    }),

    prisma.kitchenTicket.groupBy({
      by: ["stationId"],
      where,
      _count: true,
    }),
  ]);

  // Calculate overall metrics
  const ticketsWithActual = tickets.filter((t) => t.actualPrepTime);
  const avgPrepTime = ticketsWithActual.length > 0
    ? ticketsWithActual.reduce((sum, t) => sum + t.actualPrepTime, 0) / ticketsWithActual.length
    : 0;

  // Get station names
  const stationIds = stationBreakdown.map((s) => s.stationId);
  const stations = await prisma.kitchenStation.findMany({
    where: { id: { in: stationIds } },
    select: { id: true, name: true },
  });

  const stationMap = Object.fromEntries(stations.map((s) => [s.id, s.name]));

  const stationStats = stationBreakdown.map((s) => ({
    stationId: s.stationId,
    stationName: stationMap[s.stationId] || "Unknown",
    ticketCount: s._count,
  }));

  return {
    totalTickets,
    averagePrepTime: Math.round(avgPrepTime),
    stationStats,
  };
}

module.exports = {
  listTickets,
  getTicketById,
  acceptTicket,
  startTicket,
  markReady,
  markServed,
  bumpTicket,
  voidTicket,
  setPriority,
  getStationMetrics,
  getBranchMetrics,
};
