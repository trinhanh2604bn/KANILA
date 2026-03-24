const Wishlist = require("../models/wishlist.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name";

const getAllWishlists = async (req, res) => {
  try {
    const wishlists = await Wishlist.find().populate("customer_id", CUST).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all wishlists successfully", count: wishlists.length, data: wishlists });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getWishlistById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const wishlist = await Wishlist.findById(id).populate("customer_id", CUST);
    if (!wishlist) return res.status(404).json({ success: false, message: "Wishlist not found" });
    res.status(200).json({ success: true, message: "Get wishlist successfully", data: wishlist });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getWishlistsByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const wishlists = await Wishlist.find({ customer_id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get wishlists by customer successfully", count: wishlists.length, data: wishlists });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// GET /api/wishlist/me
const getMyWishlist = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }
    const customer = await Customer.findOne({ account_id: accountId }).select("_id");
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const wishlists = await Wishlist.find({ customer_id: customer._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      message: "Get my wishlist successfully",
      data: {
        items: wishlists,
        count: wishlists.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createWishlist = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);
    if (!customer_id) return res.status(400).json({ success: false, message: "customer_id is required" });
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer_id" });
    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });

    if (req.body.isDefault === true) {
      await Wishlist.updateMany({ customer_id, isDefault: true }, { isDefault: false });
    }

    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    const wishlist = await Wishlist.create(payload);
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
      await Wishlist.updateMany({ customer_id: existing.customer_id, _id: { $ne: id }, isDefault: true }, { isDefault: false });
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

module.exports = { getAllWishlists, getWishlistById, getWishlistsByCustomerId, getMyWishlist, createWishlist, updateWishlist, deleteWishlist };
