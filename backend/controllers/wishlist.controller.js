const Wishlist = require("../models/wishlist.model");
const WishlistItem = require("../models/wishlistItem.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name";

const resolveAuthCustomer = async (req) => {
  const accountId = req.user?.account_id || req.user?.accountId;
  if (!accountId || !validateObjectId(accountId)) return null;
  return Customer.findOne({ account_id: accountId });
};

const ensureDefaultWishlist = async (customerId) => {
  let wishlist = await Wishlist.findOne({ customer_id: customerId, isDefault: true });
  if (!wishlist) {
    wishlist = await Wishlist.findOne({ customer_id: customerId }).sort({ createdAt: 1 });
  }
  if (!wishlist) {
    wishlist = await Wishlist.create({
      customer_id: customerId,
      wishlistName: "My Wishlist",
      isDefault: true,
    });
  }
  if (!wishlist.isDefault) {
    wishlist.isDefault = true;
    await wishlist.save();
  }
  return wishlist;
};

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
    const customer = await resolveAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }

    const wishlists = await Wishlist.find({ customer_id: customer._id }).select("_id").lean();
    const wishlistIds = wishlists.map((w) => w._id);
    const items = wishlistIds.length
      ? await WishlistItem.find({ wishlistId: { $in: wishlistIds } }).select("productId variantId wishlistId").lean()
      : [];
    return res.status(200).json({
      success: true,
      message: "Get my wishlist successfully",
      data: {
        items: items.map((x) => ({
          productId: String(x.productId || ""),
          variantId: x.variantId ? String(x.variantId) : null,
          wishlistId: String(x.wishlistId || ""),
        })),
        count: items.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/wishlist/me/items
const getMyWishlistItems = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }

    const wishlists = await Wishlist.find({ customer_id: customer._id }).select("_id").lean();
    const wishlistIds = wishlists.map((w) => w._id);
    if (!wishlistIds.length) {
      return res.status(200).json({ success: true, message: "Get my wishlist items successfully", data: { items: [], count: 0 } });
    }

    const items = await WishlistItem.find({ wishlistId: { $in: wishlistIds } })
      .populate("productId", "productName imageUrl price")
      .populate("variantId", "variantName sku")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      message: "Get my wishlist items successfully",
      data: { items, count: items.length },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist/me/items/:id
const deleteMyWishlistItem = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    const { id } = req.params;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid wishlist item ID" });

    const customer = await Customer.findOne({ account_id: accountId }).select("_id");
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const wishlists = await Wishlist.find({ customer_id: customer._id }).select("_id").lean();
    const wishlistIds = wishlists.map((w) => w._id);
    const item = await WishlistItem.findOne({ _id: id, wishlistId: { $in: wishlistIds } });
    if (!item) return res.status(404).json({ success: false, message: "Wishlist item not found" });

    await WishlistItem.deleteOne({ _id: id });
    return res.status(200).json({ success: true, message: "Wishlist item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wishlist
const addMyWishlistProduct = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(401).json({ success: false, message: "Invalid or missing account identity" });

    const productId = String(req.body?.productId || "").trim();
    const variantIdRaw = String(req.body?.variantId || "").trim();
    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }
    if (variantIdRaw && !validateObjectId(variantIdRaw)) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }
    const [product, variant] = await Promise.all([
      Product.findById(productId).select("_id"),
      variantIdRaw ? ProductVariant.findById(variantIdRaw).select("_id productId") : Promise.resolve(null),
    ]);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (variant && String(variant.productId || "") !== String(product._id)) {
      return res.status(400).json({ success: false, message: "Variant does not belong to product" });
    }

    const wishlist = await ensureDefaultWishlist(customer._id);
    const existing = await WishlistItem.findOne({
      wishlistId: wishlist._id,
      productId: product._id,
      ...(variant ? { variantId: variant._id } : {}),
    }).lean();
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Product already in wishlist",
        data: { itemId: String(existing._id), productId: String(product._id), variantId: variant ? String(variant._id) : null },
      });
    }

    const created = await WishlistItem.create({
      wishlistId: wishlist._id,
      productId: product._id,
      variantId: variant ? variant._id : null,
    });
    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      data: { itemId: String(created._id), productId: String(product._id), variantId: variant ? String(variant._id) : null },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist/:productId
const deleteMyWishlistProductByProductId = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    const productId = String(req.params.productId || "").trim();
    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const wishlists = await Wishlist.find({ customer_id: customer._id }).select("_id").lean();
    const wishlistIds = wishlists.map((w) => w._id);
    if (!wishlistIds.length) return res.status(404).json({ success: false, message: "Wishlist not found" });

    const found = await WishlistItem.findOne({
      wishlistId: { $in: wishlistIds },
      productId,
    }).lean();
    if (!found) return res.status(404).json({ success: false, message: "Wishlist item not found" });
    await WishlistItem.deleteOne({ _id: found._id });
    return res.status(200).json({ success: true, message: "Wishlist product removed successfully" });
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

module.exports = {
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
};
