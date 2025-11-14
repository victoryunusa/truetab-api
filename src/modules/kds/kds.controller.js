const svc = require("./kds.service");
const { updateTicketStatusSchema, setPrioritySchema } = require("./kds.validation");

async function listTickets(req, res, next) {
  try {
    const { stationId, status, priority } = req.query;
    const tickets = await svc.listTickets(
      req.tenant.brandId,
      req.tenant.branchId,
      {
        stationId,
        status,
        priority: priority ? parseInt(priority) : undefined,
      }
    );
    res.json({ data: tickets });
  } catch (err) {
    next(err);
  }
}

async function getTicket(req, res, next) {
  try {
    const ticket = await svc.getTicketById(req.params.id, req.tenant.brandId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function acceptTicket(req, res, next) {
  try {
    const ticket = await svc.acceptTicket(req.params.id, req.tenant.brandId);
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function startTicket(req, res, next) {
  try {
    const ticket = await svc.startTicket(req.params.id, req.tenant.brandId);
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function markReady(req, res, next) {
  try {
    const ticket = await svc.markReady(req.params.id, req.tenant.brandId);
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function markServed(req, res, next) {
  try {
    const ticket = await svc.markServed(req.params.id, req.tenant.brandId);
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function bumpTicket(req, res, next) {
  try {
    const ticket = await svc.bumpTicket(req.params.id, req.tenant.brandId);
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function voidTicket(req, res, next) {
  try {
    const { value, error } = updateTicketStatusSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details.map((d) => d.message) });

    const ticket = await svc.voidTicket(req.params.id, req.tenant.brandId, value.delayReason);
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function setPriority(req, res, next) {
  try {
    const { value, error } = setPrioritySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details.map((d) => d.message) });

    const ticket = await svc.setPriority(req.params.id, req.tenant.brandId, value.priority);
    res.json({ data: ticket });
  } catch (err) {
    next(err);
  }
}

async function getStationMetrics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await svc.getStationMetrics(req.params.stationId, req.tenant.brandId, { startDate, endDate });
    res.json({ data: metrics });
  } catch (err) {
    next(err);
  }
}

async function getBranchMetrics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await svc.getBranchMetrics(req.tenant.branchId, req.tenant.brandId, { startDate, endDate });
    res.json({ data: metrics });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTickets,
  getTicket,
  acceptTicket,
  startTicket,
  markReady,
  markServed,
  bumpTicket,
  voidTicket,
  setPriority,
  getStationMetrics,
  getBranchMetrics,
};
