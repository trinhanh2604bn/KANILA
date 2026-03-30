const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const recommendationAnalyticsRoutes = require("./recommendation-analytics.route");
const { hideReview, unhideReview } = require("../controllers/review.controller");
const ops = require("../controllers/adminOperations.controller");

router.get("/dashboard-summary", authMiddleware, getDashboardSummary);
router.use("/recommendations/analytics", recommendationAnalyticsRoutes);

// Review visibility management
router.patch("/reviews/:id/hide", authMiddleware, hideReview);
router.patch("/reviews/:id/unhide", authMiddleware, unhideReview);

// ─── Order lifecycle ───────────────────────────────
router.patch("/orders/:id/confirm", authMiddleware, ops.confirmOrder);
router.patch("/orders/:id/processing", authMiddleware, ops.markProcessing);
router.patch("/orders/:id/cancel", authMiddleware, ops.cancelOrder);
router.patch("/orders/:id/mark-cod-paid", authMiddleware, ops.markCodPaid);

// ─── Shipment operations ───────────────────────────
router.post("/orders/:id/shipments", authMiddleware, ops.createShipment);
router.patch("/shipments/:id/ready-to-ship", authMiddleware, ops.shipmentReadyToShip);
router.patch("/shipments/:id/ship", authMiddleware, ops.shipShipment);
router.patch("/shipments/:id/in-transit", authMiddleware, ops.shipmentInTransit);
router.patch("/shipments/:id/deliver", authMiddleware, ops.deliverShipment);
router.patch("/shipments/:id/fail", authMiddleware, ops.failShipment);
router.post("/shipments/:id/events", authMiddleware, ops.addShipmentEvent);

// ─── Return operations ─────────────────────────────
router.post("/orders/:id/returns", authMiddleware, ops.createReturn);
router.patch("/returns/:id/approve", authMiddleware, ops.approveReturn);
router.patch("/returns/:id/reject", authMiddleware, ops.rejectReturn);
router.patch("/returns/:id/receive", authMiddleware, ops.receiveReturn);
router.patch("/returns/:id/complete", authMiddleware, ops.completeReturn);

// ─── Refund operations ─────────────────────────────
router.post("/orders/:id/refunds", authMiddleware, ops.createRefund);
router.patch("/refunds/:id/approve", authMiddleware, ops.approveRefund);
router.patch("/refunds/:id/complete", authMiddleware, ops.completeRefund);

module.exports = router;
