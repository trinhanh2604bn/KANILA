const express = require("express");
const router = express.Router();
const {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  patchAccount,
  deleteAccount,
} = require("../controllers/account.controller");

router.get("/", getAllAccounts);
router.post("/", createAccount);
router.get("/:id", getAccountById);
router.put("/:id", updateAccount);
router.patch("/:id", patchAccount);
router.delete("/:id", deleteAccount);

module.exports = router;
