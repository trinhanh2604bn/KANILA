const express = require("express");
const router = express.Router();
const {
  getAllCarts,
  getCartById,
  getCartsByCustomerId,
  createCart,
  updateCart,
  deleteCart,
} = require("../controllers/cart.controller");

router.get("/", getAllCarts);
router.get("/customer/:customer_id", getCartsByCustomerId);
router.get("/:id", getCartById);
router.post("/", createCart);
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);

module.exports = router;
