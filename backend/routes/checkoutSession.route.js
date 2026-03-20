const express = require("express");
const router = express.Router();
const {
  getAllCheckoutSessions,
  getCheckoutSessionById,
  getSessionsByCartId,
  createCheckoutSession,
  updateCheckoutSession,
  deleteCheckoutSession,
} = require("../controllers/checkoutSession.controller");

router.get("/", getAllCheckoutSessions);
router.get("/cart/:cartId", getSessionsByCartId);
router.get("/:id", getCheckoutSessionById);
router.post("/", createCheckoutSession);
router.put("/:id", updateCheckoutSession);
router.delete("/:id", deleteCheckoutSession);

module.exports = router;
