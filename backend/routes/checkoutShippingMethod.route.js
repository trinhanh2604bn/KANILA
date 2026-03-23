const express = require("express");
const router = express.Router();
const {
  getAllCheckoutShippingMethods,
  getCheckoutShippingMethodById,
  getMethodsBySessionId,
  createCheckoutShippingMethod,
  updateCheckoutShippingMethod,
  deleteCheckoutShippingMethod,
} = require("../controllers/checkoutShippingMethod.controller");

router.get("/", getAllCheckoutShippingMethods);
router.get("/session/:checkout_session_id", getMethodsBySessionId);
router.get("/:id", getCheckoutShippingMethodById);
router.post("/", createCheckoutShippingMethod);
router.put("/:id", updateCheckoutShippingMethod);
router.delete("/:id", deleteCheckoutShippingMethod);

module.exports = router;
