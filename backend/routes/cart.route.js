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
  getGuestCart,
  addItemToMyCart,
  addItemToGuestCart,
  updateMyCartItemQuantity,
  updateGuestCartItemQuantity,
  toggleMyCartItemSelection,
  toggleGuestCartItemSelection,
  toggleMyCartSelectionAll,
  toggleGuestCartSelectionAll,
  removeItemFromMyCart,
  removeItemFromGuestCart,
  removeSelectedFromMyCart,
  removeSelectedFromGuestCart,
  prepareMyCartCheckout,
  prepareGuestCartCheckout,
} = require("../controllers/cart.controller");

router.get("/me", authMiddleware, getMyCart);
router.get("/me/checkout-prepare", authMiddleware, prepareMyCartCheckout);
router.post("/me/items", authMiddleware, addItemToMyCart);
router.patch("/me/items/:itemId/quantity", authMiddleware, updateMyCartItemQuantity);
router.patch("/me/items/:itemId/selection", authMiddleware, toggleMyCartItemSelection);
router.patch("/me/selection", authMiddleware, toggleMyCartSelectionAll);
router.delete("/me/items/:itemId", authMiddleware, removeItemFromMyCart);
router.delete("/me/items-selected", authMiddleware, removeSelectedFromMyCart);

router.get("/guest/me", getGuestCart);
router.get("/guest/checkout-prepare", prepareGuestCartCheckout);
router.post("/guest/items", addItemToGuestCart);
router.patch("/guest/items/:itemId/quantity", updateGuestCartItemQuantity);
router.patch("/guest/items/:itemId/selection", toggleGuestCartItemSelection);
router.patch("/guest/selection", toggleGuestCartSelectionAll);
router.delete("/guest/items/:itemId", removeItemFromGuestCart);
router.delete("/guest/items-selected", removeSelectedFromGuestCart);

router.get("/", getAllCarts);
router.get("/customer/:customer_id", getCartsByCustomerId);
router.get("/:id", getCartById);
router.post("/", createCart);
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);

module.exports = router;
