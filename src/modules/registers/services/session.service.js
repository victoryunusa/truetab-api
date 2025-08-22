const { PrismaClient, SessionStatus, MovementType } = require("@prisma/client");
const prisma = new PrismaClient();

async function listForRegister(registerId, { branchId }) {
  await ensureRegisterInBranch(registerId, branchId);
  return prisma.cashSession.findMany({
    where: { registerId },
    orderBy: { openedAt: "desc" },
  });
}

async function get(sessionId, { branchId }) {
  const ses = await prisma.cashSession.findFirst({
    where: { id: sessionId, register: { branchId } },
    include: { movements: true, register: true },
  });
  if (!ses) throw new Error("Session not found");
  return ses;
}

async function open(registerId, { brandId, branchId, openingFloat, userId }) {
  // 1) Ensure register exists in branch
  await ensureRegisterInBranch(registerId, branchId);

  // 2) Ensure no OPEN session for this register
  const openExisting = await prisma.cashSession.findFirst({
    where: { registerId, status: SessionStatus.OPEN },
  });
  if (openExisting)
    throw new Error("There is already an open session on this register");

  // 3) Create new session
  return prisma.cashSession.create({
    data: {
      registerId,
      openedById: userId,
      openingFloat,
      status: SessionStatus.OPEN,
      // initial totals 0; expected computed at close
    },
  });
}

async function createMovement(
  sessionId,
  { branchId, userId, type, amount, reason, orderId }
) {
  // must be open & in tenant branch
  const ses = await prisma.cashSession.findFirst({
    where: {
      id: sessionId,
      status: SessionStatus.OPEN,
      register: { branchId },
    },
  });
  if (!ses) throw new Error("Open session not found");

  const mov = await prisma.cashMovement.create({
    data: {
      sessionId,
      type,
      amount,
      reason: reason || null,
      orderId: orderId || null,
      userId: userId || null,
    },
  });

  // Optional: keep running tallies on session (denormalized)
  const fields = {};
  if (type === MovementType.SALE) fields.cashSales = ses.cashSales.plus(amount);
  if (type === MovementType.REFUND) fields.refunds = ses.refunds.plus(amount);
  if (type === MovementType.PAID_IN) fields.paidIn = ses.paidIn.plus(amount);
  if (type === MovementType.PAID_OUT) fields.paidOut = ses.paidOut.plus(amount);
  if (type === MovementType.ADJUSTMENT)
    fields.adjustments = ses.adjustments.plus(amount);

  if (Object.keys(fields).length) {
    await prisma.cashSession.update({ where: { id: ses.id }, data: fields });
  }

  return mov;
}

async function close(registerId, { branchId, userId, countedClose, notes }) {
  // find open session
  const ses = await prisma.cashSession.findFirst({
    where: { registerId, status: SessionStatus.OPEN, register: { branchId } },
    include: { movements: true },
  });
  if (!ses) throw new Error("No open session on this register");

  // Compute expected: opening + Σ(SALE) - Σ(REFUND) + Σ(PAID_IN) - Σ(PAID_OUT) + Σ(ADJUSTMENT)
  const totals = ses.movements.reduce(
    (acc, m) => {
      const amt = Number(m.amount);
      if (m.type === "SALE") acc.sales += amt;
      else if (m.type === "REFUND") acc.refunds += amt;
      else if (m.type === "PAID_IN") acc.paidIn += amt;
      else if (m.type === "PAID_OUT") acc.paidOut += amt;
      else if (m.type === "ADJUSTMENT") acc.adjustments += amt;
      return acc;
    },
    { sales: 0, refunds: 0, paidIn: 0, paidOut: 0, adjustments: 0 }
  );

  const opening = Number(ses.openingFloat);
  const expectedClose =
    opening +
    totals.sales -
    totals.refunds +
    totals.paidIn -
    totals.paidOut +
    totals.adjustments;

  const overShort = Number(countedClose) - expectedClose;

  return prisma.cashSession.update({
    where: { id: ses.id },
    data: {
      countedClose,
      expectedClose,
      overShort,
      status: SessionStatus.CLOSED,
      closedAt: new Date(),
      closedById: userId,
      // (optional) store notes as a movement
      movements: notes
        ? {
            create: {
              type: "ADJUSTMENT",
              amount: 0,
              reason: `Close notes: ${notes}`,
              userId: userId || null,
            },
          }
        : undefined,
    },
  });
}

async function summary(sessionId, { branchId }) {
  const ses = await prisma.cashSession.findFirst({
    where: { id: sessionId, register: { branchId } },
    include: { movements: true, register: true },
  });
  if (!ses) throw new Error("Session not found");

  const totals = ses.movements.reduce((acc, m) => {
    const amt = Number(m.amount);
    acc[m.type] = (acc[m.type] || 0) + amt;
    return acc;
  }, {});

  return {
    id: ses.id,
    register: { id: ses.register.id, name: ses.register.name },
    openedAt: ses.openedAt,
    closedAt: ses.closedAt,
    openingFloat: Number(ses.openingFloat),
    expectedClose: ses.expectedClose != null ? Number(ses.expectedClose) : null,
    countedClose: ses.countedClose != null ? Number(ses.countedClose) : null,
    overShort: ses.overShort != null ? Number(ses.overShort) : null,
    totals: {
      SALE: totals.SALE || 0,
      REFUND: totals.REFUND || 0,
      PAID_IN: totals.PAID_IN || 0,
      PAID_OUT: totals.PAID_OUT || 0,
      ADJUSTMENT: totals.ADJUSTMENT || 0,
    },
  };
}

async function ensureRegisterInBranch(registerId, branchId) {
  const reg = await prisma.register.findFirst({
    where: { id: registerId, branchId },
  });
  if (!reg) throw new Error("Register not found in this branch");
}

module.exports = { listForRegister, get, open, createMovement, close, summary };
