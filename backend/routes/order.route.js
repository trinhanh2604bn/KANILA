const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllOrders,
  getOrderById,
  getOrdersByCustomerId,
  getMyOrders,
  getMyOrderSummary,
  getMyOrderById,
  getMyOrderTracking,
  reorderMyOrder,
  cancelMyOrder,
  requestReturnMyOrder,
  lookupGuestOrder,
  getGuestOrderSummary,
  getGuestOrderTracking,
  createOrder,
  updateOrder,
  patchOrder,
  deleteOrder,
} = require("../controllers/order.controller");
router.get("/me", authMiddleware, getMyOrders);
router.get("/me/summary", authMiddleware, getMyOrderSummary);
router.get("/me/:id/tracking", authMiddleware, getMyOrderTracking);
router.get("/me/:id", authMiddleware, getMyOrderById);
router.post("/:id/reorder", authMiddleware, reorderMyOrder);
router.patch("/:id/cancel", authMiddleware, cancelMyOrder);
router.post("/:id/return", authMiddleware, requestReturnMyOrder);
router.post("/guest/lookup", lookupGuestOrder);
router.get("/guest/:id/tracking", getGuestOrderTracking);
router.get("/guest/:id/summary", getGuestOrderSummary);
router.get("/", getAllOrders);
router.get("/customer/:customer_id", getOrdersByCustomerId);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.patch("/:id", patchOrder);
router.delete("/:id", deleteOrder);
module.exports = router;
