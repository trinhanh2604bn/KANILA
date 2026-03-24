const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllAddresses,
  getAddressById,
  getAddressesByCustomerId,
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/address.controller");

router.get("/me", authMiddleware, getMyAddresses);
router.get("/", getAllAddresses);
router.get("/customer/:customer_id", getAddressesByCustomerId);
router.get("/:id", getAddressById);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

module.exports = router;
