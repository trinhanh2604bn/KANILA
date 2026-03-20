const express = require("express");
const router = express.Router();
const {
  getAllShippingMethods,
  getShippingMethodById,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} = require("../controllers/shippingMethod.controller");

router.get("/", getAllShippingMethods);
router.get("/:id", getShippingMethodById);
router.post("/", createShippingMethod);
router.put("/:id", updateShippingMethod);
router.delete("/:id", deleteShippingMethod);

module.exports = router;
