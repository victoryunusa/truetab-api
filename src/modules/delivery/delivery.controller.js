const svc = require("./delivery.service");
const {
  createIntegrationSchema,
  updateIntegrationSchema,
  updateOrderStatusSchema,
} = require("./delivery.validation");

async function listProviders(req, res, next) {
  try {
    const providers = await svc.listProviders();
    res.json({ data: providers });
  } catch (err) {
    next(err);
  }
}

async function createIntegration(req, res, next) {
  try {
    const { value, error } = createIntegrationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details.map((d) => d.message) });

    const integration = await svc.createIntegration(req.tenant.brandId, value);
    res.status(201).json({ data: integration });
  } catch (err) {
    next(err);
  }
}

async function listIntegrations(req, res, next) {
  try {
    const integrations = await svc.listIntegrations(req.tenant.brandId);
    res.json({ data: integrations });
  } catch (err) {
    next(err);
  }
}

async function getIntegration(req, res, next) {
  try {
    const integration = await svc.getIntegrationById(req.params.id, req.tenant.brandId);
    if (!integration) return res.status(404).json({ error: "Integration not found" });
    res.json({ data: integration });
  } catch (err) {
    next(err);
  }
}

async function updateIntegration(req, res, next) {
  try {
    const { value, error } = updateIntegrationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details.map((d) => d.message) });

    const integration = await svc.updateIntegration(req.params.id, req.tenant.brandId, value);
    res.json({ data: integration });
  } catch (err) {
    next(err);
  }
}

async function deleteIntegration(req, res, next) {
  try {
    await svc.deleteIntegration(req.params.id, req.tenant.brandId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function listDeliveryOrders(req, res, next) {
  try {
    const { page, limit, status, provider } = req.query;
    const result = await svc.listDeliveryOrders(req.tenant.brandId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      provider,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function getDeliveryOrder(req, res, next) {
  try {
    const order = await svc.getDeliveryOrderById(req.params.id, req.tenant.brandId);
    if (!order) return res.status(404).json({ error: "Delivery order not found" });
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { value, error } = updateOrderStatusSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details.map((d) => d.message) });

    const order = await svc.updateDeliveryOrderStatus(req.params.id, req.tenant.brandId, value.status);
    res.json({ data: order });
  } catch (err) {
    next(err);
  }
}

async function getMetrics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await svc.getDeliveryMetrics(req.tenant.brandId, { startDate, endDate });
    res.json({ data: metrics });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProviders,
  createIntegration,
  listIntegrations,
  getIntegration,
  updateIntegration,
  deleteIntegration,
  listDeliveryOrders,
  getDeliveryOrder,
  updateOrderStatus,
  getMetrics,
};
