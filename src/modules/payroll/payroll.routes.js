const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const { requireRole } = require("../../middleware/rbac");

const ctrl = require("./controllers/payroll.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];
const managerGuards = [
  ...guards,
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER"),
];

// Employee Profiles
router.get("/employees", managerGuards, ctrl.listEmployeeProfiles);
router.post("/employees", managerGuards, ctrl.createEmployeeProfile);
router.get("/employees/:userId", managerGuards, ctrl.getEmployeeProfile);
router.patch("/employees/:userId", managerGuards, ctrl.updateEmployeeProfile);

// Payroll Periods
router.get("/periods", managerGuards, ctrl.listPayrollPeriods);
router.post("/periods", managerGuards, ctrl.createPayrollPeriod);
router.get("/periods/:id", managerGuards, ctrl.getPayrollPeriod);
router.patch("/periods/:id", managerGuards, ctrl.updatePayrollPeriod);
router.post("/periods/:id/generate", managerGuards, ctrl.generatePayrolls);
router.post("/periods/:id/approve", managerGuards, ctrl.approvePayrollPeriod);

// Payrolls
router.get("/:id", managerGuards, ctrl.getPayroll);
router.post("/:id/items", managerGuards, ctrl.addPayrollItem);
router.patch("/:id/status", managerGuards, ctrl.updatePayrollStatus);

module.exports = router;
