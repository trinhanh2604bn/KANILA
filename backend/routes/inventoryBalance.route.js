const express = require("express");
const router = express.Router();
const {
  getAllInventoryBalances,
  getInventoryBalanceById,
  getBalancesByWarehouseId,
  getBalancesByVariantId,
  createInventoryBalance,
  updateInventoryBalance,
  deleteInventoryBalance,
} = require("../controllers/inventoryBalance.controller");

router.get("/", getAllInventoryBalances);
router.get("/warehouse/:warehouseId", getBalancesByWarehouseId);
router.get("/variant/:variantId", getBalancesByVariantId);
router.get("/:id", getInventoryBalanceById);
router.post("/", createInventoryBalance);
router.put("/:id", updateInventoryBalance);
router.delete("/:id", deleteInventoryBalance);

module.exports = router;
