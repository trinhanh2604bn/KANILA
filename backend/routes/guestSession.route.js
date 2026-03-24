const express = require("express");
const router = express.Router();
const { bootstrapGuestSession } = require("../controllers/guestSession.controller");

router.post("/bootstrap", bootstrapGuestSession);

module.exports = router;
