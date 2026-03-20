const express = require("express");
const router = express.Router();
const { getAllOrderStatusHistory, getOrderStatusHistoryById, getHistoryByOrderId, createOrderStatusHistory, deleteOrderStatusHistory } = require("../controllers/orderStatusHistory.controller");
router.get("/", getAllOrderStatusHistory);
router.get("/order/:orderId", getHistoryByOrderId);
router.get("/:id", getOrderStatusHistoryById);
router.post("/", createOrderStatusHistory);
router.delete("/:id", deleteOrderStatusHistory);
module.exports = router;
