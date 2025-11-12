const { PrismaClient, PayrollStatus, PayType } = require("@prisma/client");
const prisma = new PrismaClient();

// Employee Profiles
async function createEmployeeProfile({ brandId, ...data }) {
  // Check if user already has a profile
  const existing = await prisma.employeeProfile.findUnique({
    where: { userId: data.userId },
  });
  if (existing) throw new Error("Employee profile already exists");

  return prisma.employeeProfile.create({
    data: { ...data, brandId },
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

async function listEmployeeProfiles({ brandId }) {
  return prisma.employeeProfile.findMany({
    where: { brandId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getEmployeeProfile(userId, { brandId }) {
  const profile = await prisma.employeeProfile.findFirst({
    where: { userId, brandId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
  });
  if (!profile) throw new Error("Employee profile not found");
  return profile;
}

async function updateEmployeeProfile(userId, { brandId, ...data }) {
  const profile = await prisma.employeeProfile.findFirst({
    where: { userId, brandId },
  });
  if (!profile) throw new Error("Employee profile not found");

  return prisma.employeeProfile.update({
    where: { id: profile.id },
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
    },
  });
}

// Payroll Periods
async function createPayrollPeriod({ brandId, ...data }) {
  // Check for overlapping periods
  const overlapping = await prisma.payrollPeriod.findFirst({
    where: {
      brandId,
      ...(data.branchId && { branchId: data.branchId }),
      OR: [
        {
          AND: [
            { startDate: { lte: data.startDate } },
            { endDate: { gt: data.startDate } },
          ],
        },
        {
          AND: [
            { startDate: { lt: data.endDate } },
            { endDate: { gte: data.endDate } },
          ],
        },
      ],
    },
  });

  if (overlapping) {
    throw new Error("Payroll period overlaps with existing period");
  }

  return prisma.payrollPeriod.create({
    data: { ...data, brandId },
  });
}

async function listPayrollPeriods({ brandId, branchId, status }) {
  return prisma.payrollPeriod.findMany({
    where: {
      brandId,
      ...(branchId && { branchId }),
      ...(status && { status }),
    },
    include: {
      payrolls: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

async function getPayrollPeriod(id, { brandId }) {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id, brandId },
    include: {
      payrolls: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: true,
        },
      },
    },
  });
  if (!period) throw new Error("Payroll period not found");
  return period;
}

async function updatePayrollPeriod(id, { brandId, ...data }) {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id, brandId },
  });
  if (!period) throw new Error("Payroll period not found");

  if (period.status === PayrollStatus.PAID) {
    throw new Error("Cannot modify a paid payroll period");
  }

  return prisma.payrollPeriod.update({
    where: { id },
    data,
  });
}

async function generatePayrolls(periodId, { brandId, branchId }) {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id: periodId, brandId },
  });
  if (!period) throw new Error("Payroll period not found");

  if (period.status !== PayrollStatus.DRAFT) {
    throw new Error("Can only generate payrolls for draft periods");
  }

  // Get all active employees
  const employees = await prisma.employeeProfile.findMany({
    where: {
      brandId,
      isActive: true,
    },
    include: {
      user: true,
    },
  });

  // Get attendance records for the period
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      brandId,
      ...(branchId && { branchId }),
      clockIn: {
        gte: period.startDate,
        lte: period.endDate,
      },
      clockOut: { not: null },
    },
    include: {
      user: true,
    },
  });

  const payrolls = [];

  for (const employee of employees) {
    const userAttendance = attendanceRecords.filter(
      (a) => a.userId === employee.userId
    );

    // Calculate hours worked
    let regularHours = 0;
    let overtimeHours = 0;

    for (const record of userAttendance) {
      const hoursWorked =
        (new Date(record.clockOut) - new Date(record.clockIn)) / 1000 / 60 / 60;
      const breakHours = (record.totalBreak || 0) / 60;
      const netHours = hoursWorked - breakHours;

      if (netHours > 8) {
        // More than 8 hours = overtime
        regularHours += 8;
        overtimeHours += netHours - 8;
      } else {
        regularHours += netHours;
      }
    }

    // Calculate pay based on employee type
    let grossPay = 0;

    if (employee.payType === PayType.HOURLY) {
      const hourlyRate = Number(employee.hourlyRate) || 0;
      const overtimeRate = Number(employee.overtimeRate) || hourlyRate * 1.5;
      grossPay = regularHours * hourlyRate + overtimeHours * overtimeRate;
    } else if (employee.payType === PayType.SALARY) {
      grossPay = Number(employee.salaryAmount) || 0;
    }

    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        periodId: period.id,
        userId: employee.userId,
        brandId,
        branchId: branchId || employee.user.currentBranchId || "",
        regularHours,
        overtimeHours,
        grossPay,
        netPay: grossPay, // Will be adjusted with deductions/bonuses
        status: PayrollStatus.DRAFT,
        items: {
          create: [
            {
              type: "REGULAR_HOURS",
              description: `Regular hours (${regularHours.toFixed(2)} hrs)`,
              amount: regularHours * (Number(employee.hourlyRate) || 0),
              quantity: regularHours,
              rate: Number(employee.hourlyRate) || 0,
            },
            ...(overtimeHours > 0
              ? [
                  {
                    type: "OVERTIME",
                    description: `Overtime (${overtimeHours.toFixed(2)} hrs)`,
                    amount:
                      overtimeHours *
                      (Number(employee.overtimeRate) ||
                        Number(employee.hourlyRate) * 1.5),
                    quantity: overtimeHours,
                    rate:
                      Number(employee.overtimeRate) ||
                      Number(employee.hourlyRate) * 1.5,
                  },
                ]
              : []),
          ],
        },
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
        items: true,
      },
    });

    payrolls.push(payroll);
  }

  return payrolls;
}

// Payroll Management
async function getPayroll(id, { brandId }) {
  const payroll = await prisma.payroll.findFirst({
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
      period: true,
      items: true,
    },
  });
  if (!payroll) throw new Error("Payroll not found");
  return payroll;
}

async function addPayrollItem(payrollId, { brandId, ...itemData }) {
  const payroll = await prisma.payroll.findFirst({
    where: { id: payrollId, brandId },
    include: { items: true },
  });
  if (!payroll) throw new Error("Payroll not found");

  if (payroll.status === PayrollStatus.PAID) {
    throw new Error("Cannot modify a paid payroll");
  }

  // Create the item
  const item = await prisma.payrollItem.create({
    data: {
      ...itemData,
      payrollId,
    },
  });

  // Recalculate payroll totals
  const allItems = await prisma.payrollItem.findMany({
    where: { payrollId },
  });

  let totalDeductions = 0;
  let totalBonuses = 0;

  for (const i of allItems) {
    const amount = Number(i.amount);
    if (i.type === "DEDUCTION") {
      totalDeductions += amount;
    } else if (
      i.type === "BONUS" ||
      i.type === "COMMISSION" ||
      i.type === "TIPS"
    ) {
      totalBonuses += amount;
    }
  }

  const netPay = Number(payroll.grossPay) + totalBonuses - totalDeductions;

  await prisma.payroll.update({
    where: { id: payrollId },
    data: {
      totalDeductions,
      totalBonuses,
      netPay,
    },
  });

  return item;
}

async function updatePayrollStatus(id, { brandId, status, notes }) {
  const payroll = await prisma.payroll.findFirst({
    where: { id, brandId },
  });
  if (!payroll) throw new Error("Payroll not found");

  const updateData = {
    status,
    ...(notes && { notes }),
  };

  if (status === PayrollStatus.PAID) {
    updateData.paidAt = new Date();
  }

  return prisma.payroll.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: true,
    },
  });
}

async function approvePayrollPeriod(periodId, { brandId }) {
  const period = await prisma.payrollPeriod.findFirst({
    where: { id: periodId, brandId },
    include: { payrolls: true },
  });
  if (!period) throw new Error("Payroll period not found");

  if (period.status !== PayrollStatus.PENDING_APPROVAL) {
    throw new Error("Period must be pending approval");
  }

  // Update all payrolls to approved
  await prisma.payroll.updateMany({
    where: {
      periodId,
      status: PayrollStatus.PENDING_APPROVAL,
    },
    data: { status: PayrollStatus.APPROVED },
  });

  return prisma.payrollPeriod.update({
    where: { id: periodId },
    data: { status: PayrollStatus.APPROVED },
  });
}

module.exports = {
  createEmployeeProfile,
  listEmployeeProfiles,
  getEmployeeProfile,
  updateEmployeeProfile,
  createPayrollPeriod,
  listPayrollPeriods,
  getPayrollPeriod,
  updatePayrollPeriod,
  generatePayrolls,
  getPayroll,
  addPayrollItem,
  updatePayrollStatus,
  approvePayrollPeriod,
};
