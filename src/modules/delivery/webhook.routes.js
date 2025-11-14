const router = require("express").Router();
const webhookCtrl = require("./webhook.controller");

// Webhook endpoints (no auth - verified by signature)
router.post("/uber-eats/:integrationId", webhookCtrl.handleUberEatsWebhook);
router.post("/doordash/:integrationId", webhookCtrl.handleDoorDashWebhook);
router.post("/grubhub/:integrationId", webhookCtrl.handleGrubhubWebhook);

// Generic webhook endpoint
router.post("/:integrationId", webhookCtrl.handleWebhook);

module.exports = router;
