const Wishlist = require("../models/wishlist.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllWishlists = async (req, res) => {
  try {
    const wishlists = await Wishlist.find().populate("customerId", "customerCode fullName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all wishlists successfully", count: wishlists.length, data: wishlists });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getWishlistById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const wishlist = await Wishlist.findById(id).populate("customerId", "customerCode fullName");
    if (!wishlist) return res.status(404).json({ success: false, message: "Wishlist not found" });
    res.status(200).json({ success: true, message: "Get wishlist successfully", data: wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getWishlistsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const wishlists = await Wishlist.find({ customerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get wishlists by customer successfully", count: wishlists.length, data: wishlists });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createWishlist = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required" });
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customerId" });
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });

    // If isDefault, unset others
    if (req.body.isDefault === true) {
      await Wishlist.updateMany({ customerId, isDefault: true }, { isDefault: false });
    }

    const wishlist = await Wishlist.create(req.body);
    res.status(201).json({ success: true, message: "Wishlist created successfully", data: wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });

    const existing = await Wishlist.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Wishlist not found" });

    if (req.body.isDefault === true) {
      await Wishlist.updateMany({ customerId: existing.customerId, _id: { $ne: id }, isDefault: true }, { isDefault: false });
    }

    const wishlist = await Wishlist.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: "Wishlist updated successfully", data: wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const wishlist = await Wishlist.findByIdAndDelete(id);
    if (!wishlist) return res.status(404).json({ success: false, message: "Wishlist not found" });
    res.status(200).json({ success: true, message: "Wishlist deleted successfully", data: wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllWishlists, getWishlistById, getWishlistsByCustomerId, createWishlist, updateWishlist, deleteWishlist };
