const express = require("express");
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  getCustomerByAccountId,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customer.controller");

router.get("/", getAllCustomers);
router.get("/account/:accountId", getCustomerByAccountId);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
