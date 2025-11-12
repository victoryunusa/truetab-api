const {
  createReservation,
  listReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  getAvailableTables,
  getTodayReservations,
} = require("./reservation.service");

const {
  createReservationSchema,
  updateReservationSchema,
  searchReservationsSchema,
  checkAvailabilitySchema,
} = require("./reservation.validation");

async function createReservationController(req, res) {
  try {
    const { value, error } = createReservationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    const reservation = await createReservation({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.status(201).json({
      message: "Reservation created successfully",
      data: reservation,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function listReservationsController(req, res) {
  try {
    const { value, error } = searchReservationsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    const result = await listReservations({
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({
      message: "Reservations retrieved successfully",
      data: result.reservations,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getReservationController(req, res) {
  try {
    const reservation = await getReservationById({
      reservationId: req.params.id,
      brandId: req.tenant.brandId,
    });

    res.json({
      message: "Reservation retrieved successfully",
      data: reservation,
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

async function updateReservationController(req, res) {
  try {
    const { value, error } = updateReservationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    const reservation = await updateReservation({
      reservationId: req.params.id,
      brandId: req.tenant.brandId,
      ...value,
    });

    res.json({
      message: "Reservation updated successfully",
      data: reservation,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function cancelReservationController(req, res) {
  try {
    const reservation = await cancelReservation({
      reservationId: req.params.id,
      brandId: req.tenant.brandId,
    });

    res.json({
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function checkAvailabilityController(req, res) {
  try {
    const { value, error } = checkAvailabilitySchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    const availableTables = await getAvailableTables(value);

    res.json({
      message: "Available tables retrieved successfully",
      data: availableTables,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTodayReservationsController(req, res) {
  try {
    const branchId = req.query.branchId;

    const result = await getTodayReservations({
      brandId: req.tenant.brandId,
      branchId,
    });

    res.json({
      message: "Today's reservations retrieved successfully",
      data: result.reservations,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createReservationController,
  listReservationsController,
  getReservationController,
  updateReservationController,
  cancelReservationController,
  checkAvailabilityController,
  getTodayReservationsController,
};
