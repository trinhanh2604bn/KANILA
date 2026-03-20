const express = require("express");
const router = express.Router();
const {
  getAllStockReservations,
  getStockReservationById,
  getReservationsByWarehouseId,
  getReservationsByVariantId,
  createStockReservation,
  updateStockReservation,
  deleteStockReservation,
} = require("../controllers/stockReservation.controller");

router.get("/", getAllStockReservations);
router.get("/warehouse/:warehouseId", getReservationsByWarehouseId);
router.get("/variant/:variantId", getReservationsByVariantId);
router.get("/:id", getStockReservationById);
router.post("/", createStockReservation);
router.put("/:id", updateStockReservation);
router.delete("/:id", deleteStockReservation);

module.exports = router;
