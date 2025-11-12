const {
  PrismaClient,
  ShiftStatus,
  AttendanceStatus,
} = require("@prisma/client");
const prisma = new PrismaClient();

// Shift Types
async function createShiftType({ brandId, ...data }) {
  return prisma.shiftType.create({
    data: { ...data, brandId },
  });
}

async function listShiftTypes({ brandId, branchId }) {
  return prisma.shiftType.findMany({
    where: {
      brandId,
      ...(branchId && { branchId }),
      isActive: true,
    },
    orderBy: { name: "asc" },
  });
}

async function updateShiftType(id, { brandId, ...data }) {
  const shiftType = await prisma.shiftType.findFirst({
    where: { id, brandId },
  });
  if (!shiftType) throw new Error("Shift type not found");

  return prisma.shiftType.update({
    where: { id },
    data,
  });
}

async function deleteShiftType(id, { brandId }) {
  const shiftType = await prisma.shiftType.findFirst({
    where: { id, brandId },
  });
  if (!shiftType) throw new Error("Shift type not found");

  // Soft delete by setting isActive to false
  return prisma.shiftType.update({
    where: { id },
    data: { isActive: false },
  });
}

// Shifts
async function createShift({ brandId, userId, branchId, ...data }) {
  // Verify user exists and is in the brand
  const user = await prisma.user.findFirst({
    where: { id: userId, brandId },
  });
  if (!user) throw new Error("User not found in this brand");

  // Check for overlapping shifts
  const overlapping = await prisma.shift.findFirst({
    where: {
      userId,
      status: { notIn: [ShiftStatus.CANCELLED] },
      OR: [
        {
          AND: [
            { scheduledStart: { lte: data.scheduledStart } },
            { scheduledEnd: { gt: data.scheduledStart } },
          ],
        },
        {
          AND: [
            { scheduledStart: { lt: data.scheduledEnd } },
            { scheduledEnd: { gte: data.scheduledEnd } },
          ],
        },
      ],
    },
  });

  if (overlapping) throw new Error("Shift overlaps with existing shift");

  return prisma.shift.create({
    data: {
      ...data,
      userId,
      brandId,
      branchId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      shiftType: true,
    },
  });
}

async function listShifts({ brandId, branchId, userId, startDate, endDate }) {
  return prisma.shift.findMany({
    where: {
      brandId,
      ...(branchId && { branchId }),
      ...(userId && { userId }),
      ...(startDate &&
        endDate && {
          scheduledStart: { gte: new Date(startDate) },
          scheduledEnd: { lte: new Date(endDate) },
        }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      shiftType: true,
      attendance: true,
    },
    orderBy: { scheduledStart: "asc" },
  });
}

async function getShift(id, { brandId }) {
  const shift = await prisma.shift.findFirst({
    where: { id, brandId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      shiftType: true,
      attendance: true,
    },
  });
  if (!shift) throw new Error("Shift not found");
  return shift;
}

async function updateShift(id, { brandId, ...data }) {
  const shift = await prisma.shift.findFirst({
    where: { id, brandId },
  });
  if (!shift) throw new Error("Shift not found");

  return prisma.shift.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      shiftType: true,
    },
  });
}

async function deleteShift(id, { brandId }) {
  const shift = await prisma.shift.findFirst({
    where: { id, brandId },
  });
  if (!shift) throw new Error("Shift not found");

  if (shift.status === ShiftStatus.IN_PROGRESS) {
    throw new Error("Cannot delete an in-progress shift");
  }

  return prisma.shift.delete({
    where: { id },
  });
}

// Attendance / Clock In/Out
async function clockIn({ userId, brandId, branchId, shiftId, notes }) {
  // Check if user already clocked in
  const existing = await prisma.attendance.findFirst({
    where: {
      userId,
      status: { in: [AttendanceStatus.CLOCKED_IN, AttendanceStatus.ON_BREAK] },
    },
  });

  if (existing) {
    throw new Error("User is already clocked in");
  }

  // If shiftId provided, verify it exists and belongs to user
  let shift = null;
  if (shiftId) {
    shift = await prisma.shift.findFirst({
      where: { id: shiftId, userId, brandId },
    });
    if (!shift) throw new Error("Shift not found");
  } else {
    // Find scheduled shift for current time
    const now = new Date();
    shift = await prisma.shift.findFirst({
      where: {
        userId,
        brandId,
        branchId,
        status: ShiftStatus.SCHEDULED,
        scheduledStart: { lte: now },
        scheduledEnd: { gte: now },
      },
      orderBy: { scheduledStart: "asc" },
    });

    if (!shift) {
      throw new Error("No scheduled shift found for current time");
    }
  }

  // Update shift status and create attendance record
  const [attendance] = await prisma.$transaction([
    prisma.attendance.create({
      data: {
        shiftId: shift.id,
        userId,
        brandId,
        branchId,
        clockIn: new Date(),
        status: AttendanceStatus.CLOCKED_IN,
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        shift: true,
      },
    }),
    prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: ShiftStatus.IN_PROGRESS,
        actualStart: new Date(),
      },
    }),
  ]);

  return attendance;
}

async function clockOut({ userId, brandId, notes }) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      status: { in: [AttendanceStatus.CLOCKED_IN, AttendanceStatus.ON_BREAK] },
    },
    include: { shift: true },
  });

  if (!attendance) {
    throw new Error("No active clock-in found");
  }

  const now = new Date();
  const totalBreak = attendance.totalBreak || 0;

  const [updated] = await prisma.$transaction([
    prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        status: AttendanceStatus.CLOCKED_OUT,
        notes: notes || attendance.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        shift: true,
      },
    }),
    prisma.shift.update({
      where: { id: attendance.shiftId },
      data: {
        status: ShiftStatus.COMPLETED,
        actualEnd: now,
        breakMinutes: totalBreak,
      },
    }),
  ]);

  return updated;
}

async function startBreak({ userId, brandId }) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      status: AttendanceStatus.CLOCKED_IN,
    },
  });

  if (!attendance) {
    throw new Error("No active clock-in found");
  }

  if (attendance.breakStart && !attendance.breakEnd) {
    throw new Error("Break already started");
  }

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      breakStart: new Date(),
      status: AttendanceStatus.ON_BREAK,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

async function endBreak({ userId, brandId }) {
  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      status: AttendanceStatus.ON_BREAK,
    },
  });

  if (!attendance) {
    throw new Error("No active break found");
  }

  const now = new Date();
  const breakDuration = Math.floor(
    (now - new Date(attendance.breakStart)) / 1000 / 60
  );
  const totalBreak = (attendance.totalBreak || 0) + breakDuration;

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      breakEnd: now,
      totalBreak,
      status: AttendanceStatus.CLOCKED_IN,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}

async function getAttendanceRecords({
  brandId,
  branchId,
  userId,
  startDate,
  endDate,
}) {
  return prisma.attendance.findMany({
    where: {
      brandId,
      ...(branchId && { branchId }),
      ...(userId && { userId }),
      ...(startDate &&
        endDate && {
          clockIn: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      shift: {
        include: {
          shiftType: true,
        },
      },
    },
    orderBy: { clockIn: "desc" },
  });
}

async function getCurrentAttendance({ userId, brandId }) {
  return prisma.attendance.findFirst({
    where: {
      userId,
      brandId,
      status: { in: [AttendanceStatus.CLOCKED_IN, AttendanceStatus.ON_BREAK] },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      shift: {
        include: {
          shiftType: true,
        },
      },
    },
  });
}

module.exports = {
  createShiftType,
  listShiftTypes,
  updateShiftType,
  deleteShiftType,
  createShift,
  listShifts,
  getShift,
  updateShift,
  deleteShift,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getAttendanceRecords,
  getCurrentAttendance,
};
