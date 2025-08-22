const router = require("express").Router();
const { auth } = require("../../middleware/auth");
const { tenant } = require("../../middleware/tenant");
const { requireActiveSubscription } = require("../../middleware/subscription");

const zoneCtrl = require("./controllers/zone.controller");
const tableCtrl = require("./controllers/table.controller");

const guards = [auth(true), tenant(true), requireActiveSubscription()];

// ZONES
router.get("/zones", guards, zoneCtrl.list);
router.post("/zones", guards, zoneCtrl.create);
router.patch("/zones/:id", guards, zoneCtrl.update);
router.delete("/zones/:id", guards, zoneCtrl.remove);

// TABLES
router.get("/tables", guards, tableCtrl.list);
router.post("/tables", guards, tableCtrl.create);
router.get("/tables/:id", guards, tableCtrl.get);
router.patch("/tables/:id", guards, tableCtrl.update);
router.delete("/tables/:id", guards, tableCtrl.remove);

// QR code for a table
router.get("/tables/:id/qrcode", guards, tableCtrl.qrCode);

module.exports = router;
