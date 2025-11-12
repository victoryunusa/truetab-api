const svc = require("../services/shift.service");
const {
  createShiftTypeSchema,
  updateShiftTypeSchema,
  createShiftSchema,
  updateShiftSchema,
  clockInSchema,
  clockOutSchema,
  breakStartSchema,
  breakEndSchema,
} = require("../validators/shift.schema");

// Shift Types
async function createShiftType(req, res) {
  try {
    const { value, error } = createShiftTypeSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.createShiftType({
      ...value,
      brandId: req.tenant.brandId,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listShiftTypes(req, res) {
  try {
    const data = await svc.listShiftTypes({
      brandId: req.tenant.brandId,
      branchId: req.query.branchId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function updateShiftType(req, res) {
  try {
    const { value, error } = updateShiftTypeSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.updateShiftType(req.params.id, {
      ...value,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function deleteShiftType(req, res) {
  try {
    const data = await svc.deleteShiftType(req.params.id, {
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Shifts
async function createShift(req, res) {
  try {
    const { value, error } = createShiftSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.createShift({
      ...value,
      brandId: req.tenant.brandId,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listShifts(req, res) {
  try {
    const data = await svc.listShifts({
      brandId: req.tenant.brandId,
      branchId: req.query.branchId,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function getShift(req, res) {
  try {
    const data = await svc.getShift(req.params.id, {
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function updateShift(req, res) {
  try {
    const { value, error } = updateShiftSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.updateShift(req.params.id, {
      ...value,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function deleteShift(req, res) {
  try {
    const data = await svc.deleteShift(req.params.id, {
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Attendance
async function clockIn(req, res) {
  try {
    const { value, error } = clockInSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.clockIn({
      ...value,
      userId: req.user.id,
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function clockOut(req, res) {
  try {
    const { value, error } = clockOutSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.clockOut({
      ...value,
      userId: req.user.id,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function startBreak(req, res) {
  try {
    const { value, error } = breakStartSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.startBreak({
      userId: req.user.id,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function endBreak(req, res) {
  try {
    const { value, error } = breakEndSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.endBreak({
      userId: req.user.id,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function getAttendanceRecords(req, res) {
  try {
    const data = await svc.getAttendanceRecords({
      brandId: req.tenant.brandId,
      branchId: req.query.branchId,
      userId: req.query.userId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function getCurrentAttendance(req, res) {
  try {
    const data = await svc.getCurrentAttendance({
      userId: req.user.id,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
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
