const express = require("express");
const router = express.Router();
const {
  getAllCartItems,
  getCartItemById,
  getItemsByCartId,
  createCartItem,
  updateCartItem,
  deleteCartItem,
} = require("../controllers/cartItem.controller");

router.get("/", getAllCartItems);
router.get("/cart/:cart_id", getItemsByCartId);
router.get("/:id", getCartItemById);
router.post("/", createCartItem);
router.put("/:id", updateCartItem);
router.delete("/:id", deleteCartItem);

module.exports = router;
