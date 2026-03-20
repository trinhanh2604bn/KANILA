const CartItem = require("../models/cartItem.model");
const Cart = require("../models/cart.model");
const ProductVariant = require("../models/productVariant.model");
const validateObjectId = require("../utils/validateObjectId");

// Helper: recalculate cart totals
const recalcCartTotals = async (cartId) => {
  const items = await CartItem.find({ cartId });
  const itemCount = items.length;
  const subtotalAmount = items.reduce((sum, item) => sum + item.lineTotalAmount, 0);
  const discountAmount = items.reduce((sum, item) => sum + (item.discountAmount * item.quantity), 0);
  const totalAmount = subtotalAmount;

  await Cart.findByIdAndUpdate(cartId, {
    itemCount,
    subtotalAmount,
    discountAmount,
    totalAmount,
  });
};

// GET /api/cart-items
const getAllCartItems = async (req, res) => {
  try {
    const items = await CartItem.find()
      .populate("cartId", "cartStatus customerId")
      .populate("variantId", "sku variantName")
      .sort({ addedAt: -1 });

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
      .populate("cartId", "cartStatus customerId")
      .populate("variantId", "sku variantName");

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

// GET /api/cart-items/cart/:cartId
const getItemsByCartId = async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!validateObjectId(cartId)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const items = await CartItem.find({ cartId })
      .populate("variantId", "sku variantName")
      .sort({ addedAt: -1 });

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
    const { cartId, variantId, skuSnapshot, productNameSnapshot, variantNameSnapshot, quantity, unitPriceAmount, finalUnitPriceAmount, lineTotalAmount } = req.body;

    if (!cartId || !variantId || !skuSnapshot || !productNameSnapshot || !variantNameSnapshot || !quantity || unitPriceAmount === undefined || finalUnitPriceAmount === undefined || lineTotalAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "cartId, variantId, skuSnapshot, productNameSnapshot, variantNameSnapshot, quantity, unitPriceAmount, finalUnitPriceAmount, and lineTotalAmount are required",
      });
    }

    if (!validateObjectId(cartId)) {
      return res.status(400).json({ success: false, message: "Invalid cartId" });
    }
    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }

    const cartExists = await Cart.findById(cartId);
    if (!cartExists) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const variantExists = await ProductVariant.findById(variantId);
    if (!variantExists) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    const item = await CartItem.create(req.body);

    // Recalculate cart totals
    await recalcCartTotals(cartId);

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

    const item = await CartItem.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // Recalculate cart totals
    await recalcCartTotals(item.cartId);

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

    // Recalculate cart totals
    await recalcCartTotals(item.cartId);

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
