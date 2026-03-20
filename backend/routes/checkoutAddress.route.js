const express = require("express");
const router = express.Router();
const {
  getAllCheckoutAddresses,
  getCheckoutAddressById,
  getAddressesBySessionId,
  createCheckoutAddress,
  updateCheckoutAddress,
  deleteCheckoutAddress,
} = require("../controllers/checkoutAddress.controller");

router.get("/", getAllCheckoutAddresses);
router.get("/session/:checkoutSessionId", getAddressesBySessionId);
router.get("/:id", getCheckoutAddressById);
router.post("/", createCheckoutAddress);
router.put("/:id", updateCheckoutAddress);
router.delete("/:id", deleteCheckoutAddress);

module.exports = router;
