const { register, login, refresh, logout } = require('./auth.service');
const { registerSchema, loginSchema, refreshSchema } = require('./auth.validation');

async function registerController(req, res) {
  try {
    const { value, error } = registerSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await register(value);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

async function loginController(req, res) {
  try {
    const { value, error } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await login(value);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

async function refreshController(req, res) {
  try {
    const { value, error } = refreshSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) return res.status(400).json({ error: error.details.map(d => d.message) });

    const result = await refresh(value);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

async function logoutController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await logout(userId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

module.exports = {
  registerController,
  loginController,
  refreshController,
  logoutController,
};
