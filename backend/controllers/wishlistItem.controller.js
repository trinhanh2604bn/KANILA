const WishlistItem = require("../models/wishlistItem.model");
const Wishlist = require("../models/wishlist.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllWishlistItems = async (req, res) => {
  try {
    const items = await WishlistItem.find().populate("productId", "productName").populate("variantId", "sku variantName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all wishlist items successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getWishlistItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await WishlistItem.findById(id).populate("productId", "productName").populate("variantId", "sku variantName");
    if (!item) return res.status(404).json({ success: false, message: "Wishlist item not found" });
    res.status(200).json({ success: true, message: "Get wishlist item successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getItemsByWishlistId = async (req, res) => {
  try {
    const { wishlistId } = req.params;
    if (!validateObjectId(wishlistId)) return res.status(400).json({ success: false, message: "Invalid wishlist ID" });
    const items = await WishlistItem.find({ wishlistId }).populate("productId", "productName").populate("variantId", "sku variantName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get items by wishlist successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createWishlistItem = async (req, res) => {
  try {
    const { wishlistId, productId } = req.body;
    if (!wishlistId || !productId) return res.status(400).json({ success: false, message: "wishlistId and productId are required" });
    if (!validateObjectId(wishlistId)) return res.status(400).json({ success: false, message: "Invalid wishlistId" });
    const wishlistExists = await Wishlist.findById(wishlistId);
    if (!wishlistExists) return res.status(404).json({ success: false, message: "Wishlist not found" });
    const item = await WishlistItem.create(req.body);
    res.status(201).json({ success: true, message: "Wishlist item created successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteWishlistItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await WishlistItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: "Wishlist item not found" });
    res.status(200).json({ success: true, message: "Wishlist item deleted successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllWishlistItems, getWishlistItemById, getItemsByWishlistId, createWishlistItem, deleteWishlistItem };
