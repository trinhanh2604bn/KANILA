const express = require("express");
const router = express.Router();
const { getAllWishlistItems, getWishlistItemById, getItemsByWishlistId, createWishlistItem, deleteWishlistItem } = require("../controllers/wishlistItem.controller");
router.get("/", getAllWishlistItems);
router.get("/wishlist/:wishlistId", getItemsByWishlistId);
router.get("/:id", getWishlistItemById);
router.post("/", createWishlistItem);
router.delete("/:id", deleteWishlistItem);
module.exports = router;
