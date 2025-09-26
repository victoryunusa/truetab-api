const {
  requestDemo,
  listDemoRequests,
  approveDemoRequest,
  rejectDemoRequest,
} = require('./demo.service');
const { demoRequestSchema, approveSchema, rejectSchema } = require('./demo.validation');

async function requestDemoController(req, res) {
  try {
    const { value, error } = demoRequestSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await requestDemo(value);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

async function listDemoRequestsController(req, res) {
  try {
    const result = await listDemoRequests();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

async function approveDemoRequestController(req, res) {
  try {
    const { value, error } = approveSchema.validate(req.params, { abortEarly: false });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await approveDemoRequest(value.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

async function rejectDemoRequestController(req, res) {
  try {
    const { value, error } = rejectSchema.validate(req.params, { abortEarly: false });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await rejectDemoRequest(value.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

module.exports = {
  requestDemoController,
  listDemoRequestsController,
  approveDemoRequestController,
  rejectDemoRequestController,
};
