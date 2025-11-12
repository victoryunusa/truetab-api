const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const { requireRole } = require("../../middleware/rbac");

const ctrl = require("./controllers/shift.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];
const managerGuards = [
  ...guards,
  requireRole("SUPER_ADMIN", "BRAND_OWNER", "BRAND_ADMIN", "BRANCH_MANAGER"),
];

// Shift Types
router.get("/types", guards, ctrl.listShiftTypes);
router.post("/types", managerGuards, ctrl.createShiftType);
router.patch("/types/:id", managerGuards, ctrl.updateShiftType);
router.delete("/types/:id", managerGuards, ctrl.deleteShiftType);

// Shifts
router.get("/", guards, ctrl.listShifts);
router.post("/", managerGuards, ctrl.createShift);
router.get("/:id", guards, ctrl.getShift);
router.patch("/:id", managerGuards, ctrl.updateShift);
router.delete("/:id", managerGuards, ctrl.deleteShift);

// Attendance
router.get("/attendance/current", guards, ctrl.getCurrentAttendance);
router.get("/attendance", guards, ctrl.getAttendanceRecords);
router.post("/clock-in", guards, ctrl.clockIn);
router.post("/clock-out", guards, ctrl.clockOut);
router.post("/break-start", guards, ctrl.startBreak);
router.post("/break-end", guards, ctrl.endBreak);

module.exports = router;
