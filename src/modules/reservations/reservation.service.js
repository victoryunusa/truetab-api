const { prisma } = require("../../lib/prisma");

/**
 * Create a reservation
 */
async function createReservation(data) {
  const { customerName, customerPhone, customerEmail, branchId, ...reservationData } = data;

  // If customer info provided but no customerId, try to find or create customer
  let customerId = data.customerId;

  if (!customerId && (customerName || customerPhone)) {
    // Try to find existing customer by phone or email
    if (customerPhone || customerEmail) {
      const existing = await prisma.customer.findFirst({
        where: {
          brandId: reservationData.brandId,
          OR: [
            customerPhone ? { phone: customerPhone } : {},
            customerEmail ? { email: customerEmail } : {},
          ].filter((condition) => Object.keys(condition).length > 0),
        },
      });

      if (existing) {
        customerId = existing.id;
      } else if (customerName) {
        // Create new customer
        const newCustomer = await prisma.customer.create({
          data: {
            brandId: reservationData.brandId,
            firstName: customerName.split(" ")[0],
            lastName: customerName.split(" ").slice(1).join(" ") || null,
            phone: customerPhone,
            email: customerEmail,
          },
        });
        customerId = newCustomer.id;
      }
    }
  }

  // Check table availability if tableId provided
  if (reservationData.tableId) {
    const isAvailable = await checkTableAvailability({
      branchId,
      tableId: reservationData.tableId,
      reservedAt: reservationData.reservedAt,
      duration: data.duration || 120,
    });

    if (!isAvailable) {
      throw new Error("Table is not available at the requested time");
    }
  }

  return await prisma.reservation.create({
    data: {
      ...reservationData,
      branchId,
      customerId,
    },
    include: {
      customer: true,
      table: true,
      branch: true,
    },
  });
}

/**
 * List reservations with filters
 */
async function listReservations({
  brandId,
  branchId,
  startDate,
  endDate,
  status,
  tableId,
  customerId,
  limit = 20,
  offset = 0,
}) {
  const where = { brandId };

  if (branchId) {
    where.branchId = branchId;
  }

  if (status) {
    where.status = status;
  }

  if (tableId) {
    where.tableId = tableId;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (startDate || endDate) {
    where.reservedAt = {};
    if (startDate) {
      where.reservedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.reservedAt.lte = new Date(endDate);
    }
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { reservedAt: "asc" },
    }),
    prisma.reservation.count({ where }),
  ]);

  return {
    reservations,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

/**
 * Get reservation by ID
 */
async function getReservationById({ reservationId, brandId }) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, brandId },
    include: {
      customer: true,
      table: {
        include: {
          zone: true,
        },
      },
      branch: true,
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  return reservation;
}

/**
 * Update reservation
 */
async function updateReservation({ reservationId, brandId, ...data }) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, brandId },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  // Check table availability if changing table or time
  if ((data.tableId || data.reservedAt) && data.status !== "CANCELLED") {
    const tableId = data.tableId || reservation.tableId;
    const reservedAt = data.reservedAt || reservation.reservedAt;
    const duration = data.duration || 120;

    if (tableId) {
      const isAvailable = await checkTableAvailability({
        branchId: reservation.branchId,
        tableId,
        reservedAt,
        duration,
        excludeReservationId: reservationId,
      });

      if (!isAvailable) {
        throw new Error("Table is not available at the requested time");
      }
    }
  }

  return await prisma.reservation.update({
    where: { id: reservationId },
    data,
    include: {
      customer: true,
      table: true,
      branch: true,
    },
  });
}

/**
 * Cancel reservation
 */
async function cancelReservation({ reservationId, brandId }) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, brandId },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.status === "SEATED") {
    throw new Error("Cannot cancel a reservation that has already been seated");
  }

  return await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
    include: {
      customer: true,
      table: true,
    },
  });
}

/**
 * Check table availability
 */
async function checkTableAvailability({
  branchId,
  tableId,
  reservedAt,
  duration = 120,
  excludeReservationId,
}) {
  const startTime = new Date(reservedAt);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const conflictingReservations = await prisma.reservation.findMany({
    where: {
      branchId,
      tableId,
      status: {
        in: ["PENDING", "CONFIRMED", "SEATED"],
      },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      AND: [
        {
          reservedAt: {
            lt: endTime,
          },
        },
        {
          reservedAt: {
            gte: new Date(startTime.getTime() - 120 * 60000), // 2 hours buffer
          },
        },
      ],
    },
  });

  return conflictingReservations.length === 0;
}

/**
 * Get available tables for a time slot
 */
async function getAvailableTables({ branchId, reservedAt, covers, duration = 120 }) {
  const startTime = new Date(reservedAt);
  const endTime = new Date(startTime.getTime() + duration * 60000);

  // Get all tables that can accommodate the party size
  const allTables = await prisma.table.findMany({
    where: {
      branchId,
      status: "AVAILABLE",
      capacity: {
        gte: covers,
      },
    },
    include: {
      zone: true,
    },
  });

  // Check each table for availability
  const availableTables = [];

  for (const table of allTables) {
    const isAvailable = await checkTableAvailability({
      branchId,
      tableId: table.id,
      reservedAt,
      duration,
    });

    if (isAvailable) {
      availableTables.push(table);
    }
  }

  return availableTables;
}

/**
 * Get upcoming reservations for today
 */
async function getTodayReservations({ brandId, branchId }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await listReservations({
    brandId,
    branchId,
    startDate: today,
    endDate: tomorrow,
    limit: 100,
    offset: 0,
  });
}

module.exports = {
  createReservation,
  listReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  checkTableAvailability,
  getAvailableTables,
  getTodayReservations,
};
