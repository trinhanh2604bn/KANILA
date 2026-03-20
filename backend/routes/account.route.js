const express = require("express");
const router = express.Router();
const {
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} = require("../controllers/account.controller");

router.get("/", getAllAccounts);
router.get("/:id", getAccountById);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);

module.exports = router;
