const express = require("express");
const router = express.Router();
const {
  getAllAddresses,
  getAddressById,
  getAddressesByCustomerId,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/address.controller");

router.get("/", getAllAddresses);
router.get("/customer/:customerId", getAddressesByCustomerId);
router.get("/:id", getAddressById);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

module.exports = router;
