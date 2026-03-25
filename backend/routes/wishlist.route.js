const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllWishlists,
  getWishlistById,
  getWishlistsByCustomerId,
  getMyWishlist,
  getMyWishlistItems,
  deleteMyWishlistItem,
  addMyWishlistProduct,
  deleteMyWishlistProductByProductId,
  createWishlist,
  updateWishlist,
  deleteWishlist,
} = require("../controllers/wishlist.controller");
router.get("/me", authMiddleware, getMyWishlist);
router.get("/me/items", authMiddleware, getMyWishlistItems);
router.delete("/me/items/:id", authMiddleware, deleteMyWishlistItem);
router.post("/", authMiddleware, addMyWishlistProduct);
router.delete("/:productId", authMiddleware, deleteMyWishlistProductByProductId);
router.get("/", getAllWishlists);
router.get("/customer/:customer_id", getWishlistsByCustomerId);
router.get("/:id", getWishlistById);
router.put("/:id", updateWishlist);
router.delete("/admin/:id", deleteWishlist);
router.post("/admin/create", createWishlist);
module.exports = router;
