const express = require("express");
const router = express.Router();
const {
  getAllInventoryTransactions,
  getInventoryTransactionById,
  getTransactionsByWarehouseId,
  getTransactionsByVariantId,
  createInventoryTransaction,
  deleteInventoryTransaction,
} = require("../controllers/inventoryTransaction.controller");

router.get("/", getAllInventoryTransactions);
router.get("/warehouse/:warehouseId", getTransactionsByWarehouseId);
router.get("/variant/:variantId", getTransactionsByVariantId);
router.get("/:id", getInventoryTransactionById);
router.post("/", createInventoryTransaction);
router.delete("/:id", deleteInventoryTransaction);

module.exports = router;
