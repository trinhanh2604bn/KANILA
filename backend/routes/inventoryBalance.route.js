const express = require("express");
const router = express.Router();
const {
  getAllInventoryBalances,
  getInventoryBalanceById,
  getBalancesByWarehouseId,
  getBalancesByProductId,
  getBalancesByVariantId,
  createInventoryBalance,
  updateInventoryBalance,
  deleteInventoryBalance,
} = require("../controllers/inventoryBalance.controller");

router.get("/", getAllInventoryBalances);
router.get("/warehouse/:warehouseId", getBalancesByWarehouseId);
router.get("/product/:productId", getBalancesByProductId);
router.get("/variant/:variantId", getBalancesByVariantId);
router.get("/:id", getInventoryBalanceById);
router.post("/", createInventoryBalance);
router.put("/:id", updateInventoryBalance);
router.delete("/:id", deleteInventoryBalance);

module.exports = router;
