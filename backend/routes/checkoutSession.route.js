const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllCheckoutSessions,
  getCheckoutSessionById,
  getSessionsByCartId,
  createCheckoutSession,
  updateCheckoutSession,
  deleteCheckoutSession,
  createMyCheckoutSession,
  prepareGuestCheckoutSession,
  createGuestCheckoutSession,
  createGuestBuyNowCheckoutSession,
  getGuestCheckoutSessionById,
  updateGuestCheckoutSession,
  placeGuestCheckoutSessionOrder,
  createMyBuyNowCheckoutSession,
  getMyCheckoutSessionById,
  updateMyCheckoutSession,
  placeMyCheckoutSessionOrder,
} = require("../controllers/checkoutSession.controller");

// Guest paths first (literal segments before /:id-style routes)
router.post("/guest/prepare", prepareGuestCheckoutSession);
router.post("/guest/buy-now", createGuestBuyNowCheckoutSession);
router.post("/guest/me", createGuestCheckoutSession);
router.get("/guest/me/:id", getGuestCheckoutSessionById);
router.patch("/guest/:id", updateGuestCheckoutSession);
router.post("/guest/:id/place-order", placeGuestCheckoutSessionOrder);

// Authenticated customer checkout
router.post("/me", authMiddleware, createMyCheckoutSession);
router.post("/me/buy-now", authMiddleware, createMyBuyNowCheckoutSession);
router.get("/me/:id", authMiddleware, getMyCheckoutSessionById);
router.patch("/:id", authMiddleware, updateMyCheckoutSession);
router.post("/:id/place-order", authMiddleware, placeMyCheckoutSessionOrder);

// Generic CRUD (admin / tooling)
router.get("/", getAllCheckoutSessions);
router.get("/cart/:cart_id", getSessionsByCartId);
router.get("/:id", getCheckoutSessionById);
router.post("/", createCheckoutSession);
router.put("/:id", updateCheckoutSession);
router.delete("/:id", deleteCheckoutSession);

module.exports = router;
