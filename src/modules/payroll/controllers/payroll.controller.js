const svc = require("../services/payroll.service");
const {
  createEmployeeProfileSchema,
  updateEmployeeProfileSchema,
  createPayrollPeriodSchema,
  updatePayrollPeriodSchema,
  addPayrollItemSchema,
  updatePayrollStatusSchema,
} = require("../validators/payroll.schema");

// Employee Profiles
async function createEmployeeProfile(req, res) {
  try {
    const { value, error } = createEmployeeProfileSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.createEmployeeProfile({
      ...value,
      brandId: req.tenant.brandId,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listEmployeeProfiles(req, res) {
  try {
    const data = await svc.listEmployeeProfiles({
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function getEmployeeProfile(req, res) {
  try {
    const data = await svc.getEmployeeProfile(req.params.userId, {
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function updateEmployeeProfile(req, res) {
  try {
    const { value, error } = updateEmployeeProfileSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.updateEmployeeProfile(req.params.userId, {
      ...value,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Payroll Periods
async function createPayrollPeriod(req, res) {
  try {
    const { value, error } = createPayrollPeriodSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.createPayrollPeriod({
      ...value,
      brandId: req.tenant.brandId,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listPayrollPeriods(req, res) {
  try {
    const data = await svc.listPayrollPeriods({
      brandId: req.tenant.brandId,
      branchId: req.query.branchId,
      status: req.query.status,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function getPayrollPeriod(req, res) {
  try {
    const data = await svc.getPayrollPeriod(req.params.id, {
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function updatePayrollPeriod(req, res) {
  try {
    const { value, error } = updatePayrollPeriodSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.updatePayrollPeriod(req.params.id, {
      ...value,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function generatePayrolls(req, res) {
  try {
    const data = await svc.generatePayrolls(req.params.id, {
      brandId: req.tenant.brandId,
      branchId: req.tenant.branchId,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function approvePayrollPeriod(req, res) {
  try {
    const data = await svc.approvePayrollPeriod(req.params.id, {
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// Payrolls
async function getPayroll(req, res) {
  try {
    const data = await svc.getPayroll(req.params.id, {
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
}

async function addPayrollItem(req, res) {
  try {
    const { value, error } = addPayrollItemSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.addPayrollItem(req.params.id, {
      ...value,
      brandId: req.tenant.brandId,
    });
    res.status(201).json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function updatePayrollStatus(req, res) {
  try {
    const { value, error } = updatePayrollStatusSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });

    const data = await svc.updatePayrollStatus(req.params.id, {
      ...value,
      brandId: req.tenant.brandId,
    });
    res.json({ data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
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
  approvePayrollPeriod,
  getPayroll,
  addPayrollItem,
  updatePayrollStatus,
};
