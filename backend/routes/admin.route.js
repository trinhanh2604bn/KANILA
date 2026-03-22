const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/admin.controller");

router.get("/dashboard-summary", getDashboardSummary);

module.exports = router;
