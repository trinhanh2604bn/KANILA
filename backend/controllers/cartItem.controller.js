const CartItem = require("../models/cartItem.model");
const Cart = require("../models/cart.model");
const ProductVariant = require("../models/productVariant.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeCartItemBody } = require("../utils/cartCheckoutNormalize");
const { computeCartSummary } = require("../utils/cartSummary");

const recalcCartTotals = async (cart_id) => {
  const items = await CartItem.find({ cart_id });
  const summary = computeCartSummary(items);

  await Cart.findByIdAndUpdate(cart_id, {
    item_count: summary.itemCount,
    subtotal_amount: summary.subtotal,
    discount_amount: summary.discountTotal,
    total_amount: summary.grandTotal,
  });
};

// GET /api/cart-items
const getAllCartItems = async (req, res) => {
  try {
    const items = await CartItem.find()
      .populate("cart_id", "cart_status customer_id")
      .populate("variant_id", "sku variantName")
      .sort({ added_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all cart items successfully",
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/cart-items/:id
const getCartItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID" });
    }

    const item = await CartItem.findById(id)
      .populate("cart_id", "cart_status customer_id")
      .populate("variant_id", "sku variantName");

    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get cart item successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/cart-items/cart/:cart_id
const getItemsByCartId = async (req, res) => {
  try {
    const cart_id = req.params.cart_id ?? req.params.cartId;

    if (!validateObjectId(cart_id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const items = await CartItem.find({ cart_id })
      .populate("variant_id", "sku variantName")
      .sort({ added_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get items by cart successfully",
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cart-items
const createCartItem = async (req, res) => {
  try {
    const body = normalizeCartItemBody(req.body);
    const {
      cart_id,
      variant_id,
      sku_snapshot,
      product_name_snapshot,
      variant_name_snapshot,
      quantity,
      unit_price_amount,
      final_unit_price_amount,
      line_total_amount,
    } = body;

    if (
      !cart_id ||
      !variant_id ||
      !sku_snapshot ||
      !product_name_snapshot ||
      !variant_name_snapshot ||
      !quantity ||
      unit_price_amount === undefined ||
      final_unit_price_amount === undefined ||
      line_total_amount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "cart_id, variant_id, sku_snapshot, product_name_snapshot, variant_name_snapshot, quantity, unit_price_amount, final_unit_price_amount, and line_total_amount are required",
      });
    }

    if (!validateObjectId(cart_id)) {
      return res.status(400).json({ success: false, message: "Invalid cart_id" });
    }
    if (!validateObjectId(variant_id)) {
      return res.status(400).json({ success: false, message: "Invalid variant_id" });
    }

    const cartExists = await Cart.findById(cart_id);
    if (!cartExists) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const variantExists = await ProductVariant.findById(variant_id);
    if (!variantExists) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    const item = await CartItem.create(body);

    await recalcCartTotals(cart_id);

    res.status(201).json({
      success: true,
      message: "Cart item created successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/cart-items/:id
const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID" });
    }

    const existingItem = await CartItem.findById(id);
    if (!existingItem) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    const item = await CartItem.findByIdAndUpdate(id, normalizeCartItemBody(req.body), {
      new: true,
      runValidators: true,
    });

    await recalcCartTotals(item.cart_id);

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart-items/:id
const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID" });
    }

    const item = await CartItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    await recalcCartTotals(item.cart_id);

    res.status(200).json({
      success: true,
      message: "Cart item deleted successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCartItems,
  getCartItemById,
  getItemsByCartId,
  createCartItem,
  updateCartItem,
  deleteCartItem,
};
