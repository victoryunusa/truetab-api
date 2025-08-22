const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const svc = require("./services/adjustment.service");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

router.post("/adjustments", guards, async (req, res) => {
  try {
    const data = await svc.createAdjustment(req.tenant.brandId, {
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/adjustments", guards, async (req, res) => {
  const data = await svc.listAdjustments(req.tenant.brandId);
  res.json({ data });
});

module.exports = router;
