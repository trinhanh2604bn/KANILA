const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllCustomers,
  getCustomerById,
  getCustomerByAccountId,
  getMyCustomerProfile,
  updateCustomer,
  patchCustomer,
  deleteCustomer,
} = require("../controllers/customer.controller");

router.get("/me", authMiddleware, getMyCustomerProfile);
router.get("/", getAllCustomers);
router.get("/account/:account_id", getCustomerByAccountId);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.patch("/:id", patchCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
