const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllCarts,
  getCartById,
  getCartsByCustomerId,
  createCart,
  updateCart,
  deleteCart,
  getMyCart,
  addItemToMyCart,
  updateMyCartItemQuantity,
  toggleMyCartItemSelection,
  toggleMyCartSelectionAll,
  removeItemFromMyCart,
  removeSelectedFromMyCart,
  prepareMyCartCheckout,
} = require("../controllers/cart.controller");

router.get("/me", authMiddleware, getMyCart);
router.get("/me/checkout-prepare", authMiddleware, prepareMyCartCheckout);
router.post("/me/items", authMiddleware, addItemToMyCart);
router.patch("/me/items/:itemId/quantity", authMiddleware, updateMyCartItemQuantity);
router.patch("/me/items/:itemId/selection", authMiddleware, toggleMyCartItemSelection);
router.patch("/me/selection", authMiddleware, toggleMyCartSelectionAll);
router.delete("/me/items/:itemId", authMiddleware, removeItemFromMyCart);
router.delete("/me/items-selected", authMiddleware, removeSelectedFromMyCart);

router.get("/", getAllCarts);
router.get("/customer/:customer_id", getCartsByCustomerId);
router.get("/:id", getCartById);
router.post("/", createCart);
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);

module.exports = router;
