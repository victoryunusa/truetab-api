const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const { requireRole } = require("../../middleware/rbac");

const {
  createReservationController,
  listReservationsController,
  getReservationController,
  updateReservationController,
  cancelReservationController,
  checkAvailabilityController,
  getTodayReservationsController,
} = require("./reservation.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

// List and create reservations
router.get("/", guards, listReservationsController);
router.post("/", guards, createReservationController);

// Check availability
router.get("/availability", guards, checkAvailabilityController);

// Today's reservations
router.get("/today", guards, getTodayReservationsController);

// Single reservation operations
router.get("/:id", guards, getReservationController);
router.patch("/:id", guards, updateReservationController);
router.post("/:id/cancel", guards, cancelReservationController);

module.exports = router;
