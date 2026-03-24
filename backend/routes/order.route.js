const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllOrders,
  getOrderById,
  getOrdersByCustomerId,
  getMyOrders,
  getMyOrderById,
  getMyOrderTracking,
  createOrder,
  updateOrder,
  patchOrder,
  deleteOrder,
} = require("../controllers/order.controller");
router.get("/me", authMiddleware, getMyOrders);
router.get("/me/:id/tracking", authMiddleware, getMyOrderTracking);
router.get("/me/:id", authMiddleware, getMyOrderById);
router.get("/", getAllOrders);
router.get("/customer/:customer_id", getOrdersByCustomerId);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.patch("/:id", patchOrder);
router.delete("/:id", deleteOrder);
module.exports = router;
