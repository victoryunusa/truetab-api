const router = require("express").Router();
const { acceptInviteController } = require("./invite.controller");

// Public route (no auth required)
router.post("/accept", acceptInviteController);

module.exports = router;
