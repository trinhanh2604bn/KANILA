const express = require("express");
const router = express.Router();
const c = require("../controllers/customerPreference.controller");

router.get("/", c.getAll);
router.get("/customer/:customer_id", c.getByCustomer);
router.get("/:id", c.getById);
router.post("/", c.upsert);
router.delete("/:id", c.deleteRow);

module.exports = router;
