const express = require("express");
const router = express.Router();
const c = require("../controllers/customerConsent.controller");

router.get("/", c.getAll);
router.get("/customer/:customer_id", c.getByCustomer);
router.get("/:id", c.getById);
router.post("/", c.createRow);
router.put("/:id", c.updateRow);
router.delete("/:id", c.deleteRow);

module.exports = router;
