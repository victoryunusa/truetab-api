const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");
const svc = require("./services/transfer.service");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

// Create transfer
router.post("/transfers", guards, async (req, res) => {
  try {
    const data = await svc.createTransfer(req.tenant.brandId, {
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Complete transfer
router.post("/transfers/:id/complete", guards, async (req, res) => {
  try {
    const data = await svc.completeTransfer(
      req.params.id,
      req.tenant.brandId,
      req.user.id
    );
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List transfers
router.get("/transfers", guards, async (req, res) => {
  const data = await svc.listTransfers(req.tenant.brandId);
  res.json({ data });
});

module.exports = router;
