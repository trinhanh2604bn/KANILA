const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");
const Customer = require("../models/customer.model");
const Account = require("../models/account.model");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");
const { normalizeCartBody } = require("../utils/cartCheckoutNormalize");
const { computeCartSummary } = require("../utils/cartSummary");

const CUST = "customer_code full_name";
const CART_ERROR = {
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  VARIANT_UNAVAILABLE: "VARIANT_UNAVAILABLE",
  PRICE_CHANGED: "PRICE_CHANGED",
};

const buildEmptyNormalizedCart = ({ source = "database", customerId = null } = {}) => ({
  cartId: null,
  source,
  customerId,
  items: [],
  summary: computeCartSummary([]),
  updatedAt: new Date().toISOString(),
});

const toNormalizedItem = (item) => {
  const productId = item.product_id?._id || item.product_id || item.variant_id?.productId?._id || null;
  const variantId = item.variant_id?._id || item.variant_id || null;
  const compareAt = Number(item.compare_at_price_amount || 0);
  const unit = Number(item.final_unit_price_amount ?? item.unit_price_amount ?? 0);
  const discountPercent = compareAt > unit ? Math.round(((compareAt - unit) / compareAt) * 100) : 0;

  return {
    cartItemId: String(item._id),
    lineKey: item.line_key || `${productId || "p"}::${variantId || "v"}`,
    productId: productId ? String(productId) : "",
    variantId: variantId ? String(variantId) : null,
    productName: item.product_name_snapshot || "",
    brandName: item.brand_name_snapshot || "",
    variantLabel: item.variant_name_snapshot || "",
    imageUrl: item.image_url_snapshot || "",
    unitPrice: Number(item.unit_price_amount || 0),
    compareAtPrice: compareAt || null,
    discountPercent,
    quantity: Number(item.quantity || 1),
    selected: item.selected !== false,
    stockStatus: item.stock_status || "in_stock",
    lineSubtotal: Number(item.unit_price_amount || 0) * Number(item.quantity || 1),
    lineTotal: Number(item.final_unit_price_amount || 0) * Number(item.quantity || 1),
  };
};

const toMoney = (v) => Math.max(0, Math.round(Number(v || 0)));
const buildLineKey = (productId, variantId) => `${String(productId)}::${String(variantId || "default")}`;

const getAvailableStockForProduct = (product) => Math.max(0, Number(product?.stock || 0));

const computeStockStatus = (product) => (getAvailableStockForProduct(product) > 0 ? "in_stock" : "out_of_stock");

const ensureDefaultVariantForProduct = async (product) => {
  const productId = product?._id;
  if (!productId) return null;
  const skuBase = String(product?.productCode || productId).replace(/\s+/g, "-").toUpperCase();
  let variant = await ProductVariant.findOne({ productId }).sort({ createdAt: 1 });
  if (variant) return variant;

  const suffix = String(productId).slice(-6).toUpperCase();
  const sku = `${skuBase}-DEFAULT-${suffix}`;
  try {
    variant = await ProductVariant.create({
      productId,
      sku,
      variantName: "Default",
      variantStatus: "active",
      barcode: "",
      weightGrams: 0,
      volumeMl: 0,
      costAmount: 0,
    });
    return variant;
  } catch {
    // If a parallel request created it first, load again.
    return ProductVariant.findOne({ productId }).sort({ createdAt: 1 });
  }
};

const applySnapshotPricingFromProduct = (item, product) => {
  const unitPrice = toMoney(product?.price || 0);
  const compareAt = toMoney(item.compare_at_price_amount || 0);
  item.unit_price_amount = unitPrice;
  item.final_unit_price_amount = unitPrice;
  item.compare_at_price_amount = compareAt > unitPrice ? compareAt : 0;
  item.stock_status = computeStockStatus(product);
  item.line_total_amount = unitPrice * Math.max(1, Number(item.quantity || 1));
};

const generateCustomerCode = async () => {
  const base = await Customer.countDocuments();
  let attempt = 0;
  while (attempt < 5) {
    const next = base + attempt + 1;
    const code = `CUS${String(next).padStart(4, "0")}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Customer.findOne({ customer_code: code }).select("_id").lean();
    if (!exists) return code;
    attempt += 1;
  }
  return `CUS${Date.now()}`;
};

const findCustomerByAuth = async (req) => {
  const accountId = req.user?.account_id || req.user?.accountId;
  if (!accountId || !validateObjectId(accountId)) return null;
  let customer = await Customer.findOne({ account_id: accountId });
  if (customer) return customer;

  // Auto-heal legacy data: some older customer accounts were created
  // without a matching customer profile, which blocks /carts/me endpoints.
  const account = await Account.findById(accountId).select("_id account_type email username");
  if (!account) return null;

  const fallbackName = account.username || account.email || "Customer";
  const customerCode = await generateCustomerCode();
  customer = await Customer.create({
    account_id: account._id,
    customer_code: customerCode,
    full_name: fallbackName,
    first_name: "",
    last_name: "",
    customer_status: "active",
  });
  return customer;
};

const resolveGuestSessionId = (req) => {
  const id =
    req.headers["x-guest-session-id"] ||
    req.body?.guestSessionId ||
    req.query?.guestSessionId;
  return String(id || "").trim().slice(0, 128);
};

const ensureActiveCartForCustomer = async (customerId) => {
  let cart = await Cart.findOne({ customer_id: customerId, cart_status: "active" }).sort({ updated_at: -1 });
  if (!cart) {
    cart = await Cart.create({
      customer_id: customerId,
      cart_status: "active",
      currency_code: "VND",
      item_count: 0,
      subtotal_amount: 0,
      discount_amount: 0,
      total_amount: 0,
    });
  }
  return cart;
};

const ensureActiveCartForGuest = async (guestSessionId) => {
  let cart = await Cart.findOne({
    owner_type: "guest",
    guest_session_id: guestSessionId,
    cart_status: "active",
  }).sort({ updated_at: -1 });
  if (!cart) {
    cart = await Cart.create({
      owner_type: "guest",
      guest_session_id: guestSessionId,
      customer_id: null,
      cart_status: "active",
      currency_code: "VND",
      item_count: 0,
      subtotal_amount: 0,
      discount_amount: 0,
      total_amount: 0,
    });
  }
  return cart;
};

const loadNormalizedCart = async (cart, customerId) => {
  const items = await CartItem.find({ cart_id: cart._id })
    .populate("product_id", "_id")
    .populate({ path: "variant_id", select: "_id productId", populate: { path: "productId", select: "_id" } })
    .sort({ added_at: -1 });

  const summary = computeCartSummary(items);

  await Cart.findByIdAndUpdate(cart._id, {
    item_count: summary.itemCount,
    subtotal_amount: summary.subtotal,
    discount_amount: summary.discountTotal,
    total_amount: summary.grandTotal,
  });

  return {
    cartId: String(cart._id),
    source: "database",
    customerId: String(customerId),
    items: items.map(toNormalizedItem),
    summary,
    updatedAt: new Date().toISOString(),
  };
};

// GET /api/carts
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate("customer_id", CUST)
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all carts successfully",
      count: carts.length,
      data: carts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carts/:id
const getCartById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const cart = await Cart.findById(id).populate("customer_id", CUST);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get cart successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carts/customer/:customer_id
const getCartsByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;

    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const carts = await Cart.find({ customer_id }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get carts by customer successfully",
      count: carts.length,
      data: carts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/carts
const createCart = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);

    if (!customer_id) {
      return res.status(400).json({ success: false, message: "customer_id is required" });
    }

    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer_id" });
    }

    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const payload = normalizeCartBody({ ...req.body, customer_id });
    delete payload.customerId;

    const cart = await Cart.create(payload);

    res.status(201).json({
      success: true,
      message: "Cart created successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/carts/:id
const updateCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const cart = await Cart.findByIdAndUpdate(id, normalizeCartBody(req.body), {
      new: true,
      runValidators: true,
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/carts/:id
const deleteCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const cart = await Cart.findByIdAndDelete(id);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carts/me
const getMyCart = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }

    const cart = await ensureActiveCartForCustomer(customer._id);
    const normalized = await loadNormalizedCart(cart, customer._id);

    return res.status(200).json({ success: true, message: "Get current cart successfully", data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carts/guest/me
const getGuestCart = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    if (!guestSessionId) {
      return res.status(400).json({ success: false, message: "guestSessionId is required" });
    }
    const cart = await ensureActiveCartForGuest(guestSessionId);
    const normalized = await loadNormalizedCart(cart, null);
    return res.status(200).json({
      success: true,
      message: "Get guest cart successfully",
      data: { ...normalized, source: "guest", customerId: null, guestSessionId },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/carts/me/items
const addItemToMyCart = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }

    const { productId, variantId, quantity = 1 } = req.body || {};
    const qty = Math.max(1, Number(quantity || 1));
    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const product = await Product.findById(productId).populate("brandId", "brandName");
    if (!product) {
      return res.status(404).json({ success: false, code: CART_ERROR.PRODUCT_UNAVAILABLE, message: "Product not found or unavailable" });
    }
    if (product.isActive === false || product.productStatus === "inactive") {
      return res.status(409).json({ success: false, code: CART_ERROR.PRODUCT_UNAVAILABLE, message: "Product is unavailable" });
    }

    let variant = null;
    if (variantId && validateObjectId(variantId)) {
      variant = await ProductVariant.findOne({ _id: variantId, productId: product._id });
    }
    if (!variant) {
      variant = await ProductVariant.findOne({ productId: product._id, variantStatus: "active" }).sort({ createdAt: 1 });
    }
    // Resilience fallback: some legacy products have variants but variantStatus is not maintained.
    // In that case, pick first available variant to avoid false "variant unavailable" on add-to-cart.
    if (!variant) {
      variant = await ProductVariant.findOne({ productId: product._id }).sort({ createdAt: 1 });
    }
    if (!variant) {
      variant = await ensureDefaultVariantForProduct(product);
    }
    if (!variant) {
      return res.status(409).json({ success: false, code: CART_ERROR.VARIANT_UNAVAILABLE, message: "Variant not found or unavailable" });
    }

    const availableStock = getAvailableStockForProduct(product);
    if (availableStock <= 0) {
      return res.status(409).json({ success: false, code: CART_ERROR.INSUFFICIENT_STOCK, message: "Insufficient stock", data: { availableStock } });
    }

    const cart = await ensureActiveCartForCustomer(customer._id);
    const lineKey = buildLineKey(product._id, variant._id);
    const existing = await CartItem.findOne({
      cart_id: cart._id,
      $or: [{ line_key: lineKey }, { product_id: product._id, variant_id: variant._id }],
    });

    const unitPrice = Number(product.price || 0);
    const compareAt = Number(req.body?.compareAtPrice || unitPrice || 0);
    const finalUnit = unitPrice;
    const payload = {
      product_id: product._id,
      cart_id: cart._id,
      variant_id: variant._id,
      sku_snapshot: variant.sku || product.productCode || String(product._id),
      product_name_snapshot: product.productName || "Product",
      variant_name_snapshot: variant.variantName || "Default",
      brand_name_snapshot: product.brandId?.brandName || "",
      image_url_snapshot: product.imageUrl || "",
      compare_at_price_amount: compareAt > finalUnit ? compareAt : 0,
      stock_status: Number(product.stock || 0) > 0 ? "in_stock" : "out_of_stock",
      unit_price_amount: unitPrice,
      discount_amount: 0,
      final_unit_price_amount: finalUnit,
      selected: true,
      line_key: lineKey,
    };

    if (existing) {
      const nextQty = Math.max(1, Number(existing.quantity || 1) + qty);
      if (nextQty > availableStock) {
        return res.status(409).json({
          success: false,
          code: CART_ERROR.INSUFFICIENT_STOCK,
          message: "Insufficient stock for requested quantity",
          data: { availableStock, requestedQuantity: nextQty },
        });
      }
      existing.quantity = nextQty;
      existing.unit_price_amount = payload.unit_price_amount;
      existing.discount_amount = payload.discount_amount;
      existing.final_unit_price_amount = payload.final_unit_price_amount;
      existing.line_total_amount = existing.final_unit_price_amount * existing.quantity;
      existing.product_id = payload.product_id;
      existing.product_name_snapshot = payload.product_name_snapshot;
      existing.variant_name_snapshot = payload.variant_name_snapshot;
      existing.brand_name_snapshot = payload.brand_name_snapshot;
      existing.image_url_snapshot = payload.image_url_snapshot;
      existing.compare_at_price_amount = payload.compare_at_price_amount;
      existing.stock_status = payload.stock_status;
      existing.selected = true;
      existing.line_key = lineKey;
      await existing.save();
    } else {
      if (qty > availableStock) {
        return res.status(409).json({
          success: false,
          code: CART_ERROR.INSUFFICIENT_STOCK,
          message: "Insufficient stock for requested quantity",
          data: { availableStock, requestedQuantity: qty },
        });
      }
      await CartItem.create({
        ...payload,
        quantity: qty,
        line_total_amount: payload.final_unit_price_amount * qty,
      });
    }

    const normalized = await loadNormalizedCart(cart, customer._id);
    return res.status(200).json({ success: true, message: "Item added to cart successfully", data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/carts/guest/items
const addItemToGuestCart = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    if (!guestSessionId) {
      return res.status(400).json({ success: false, message: "guestSessionId is required" });
    }

    const { productId, variantId, quantity = 1 } = req.body || {};
    const qty = Math.max(1, Number(quantity || 1));
    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const product = await Product.findById(productId).populate("brandId", "brandName");
    if (!product || product.isActive === false || product.productStatus === "inactive") {
      return res.status(409).json({ success: false, code: CART_ERROR.PRODUCT_UNAVAILABLE, message: "Product is unavailable" });
    }

    let variant = null;
    if (variantId && validateObjectId(variantId)) {
      variant = await ProductVariant.findOne({ _id: variantId, productId: product._id });
    }
    if (!variant) variant = await ProductVariant.findOne({ productId: product._id, variantStatus: "active" }).sort({ createdAt: 1 });
    if (!variant) variant = await ProductVariant.findOne({ productId: product._id }).sort({ createdAt: 1 });
    if (!variant) variant = await ensureDefaultVariantForProduct(product);
    if (!variant) {
      return res.status(409).json({ success: false, code: CART_ERROR.VARIANT_UNAVAILABLE, message: "Variant is unavailable" });
    }

    const availableStock = getAvailableStockForProduct(product);
    if (qty > availableStock) {
      return res.status(409).json({
        success: false,
        code: CART_ERROR.INSUFFICIENT_STOCK,
        message: "Insufficient stock for requested quantity",
        data: { availableStock, requestedQuantity: qty },
      });
    }

    const cart = await ensureActiveCartForGuest(guestSessionId);
    const lineKey = buildLineKey(product._id, variant._id);
    const existing = await CartItem.findOne({
      cart_id: cart._id,
      $or: [{ line_key: lineKey }, { product_id: product._id, variant_id: variant._id }],
    });

    const unitPrice = Number(product.price || 0);
    const compareAt = Number(req.body?.compareAtPrice || unitPrice || 0);
    const payload = {
      product_id: product._id,
      cart_id: cart._id,
      variant_id: variant._id,
      sku_snapshot: variant.sku || product.productCode || String(product._id),
      product_name_snapshot: product.productName || "Product",
      variant_name_snapshot: variant.variantName || "Default",
      brand_name_snapshot: product.brandId?.brandName || "",
      image_url_snapshot: product.imageUrl || "",
      compare_at_price_amount: compareAt > unitPrice ? compareAt : 0,
      stock_status: Number(product.stock || 0) > 0 ? "in_stock" : "out_of_stock",
      unit_price_amount: unitPrice,
      discount_amount: 0,
      final_unit_price_amount: unitPrice,
      selected: true,
      line_key: lineKey,
    };

    if (existing) {
      const nextQty = Math.max(1, Number(existing.quantity || 1) + qty);
      if (nextQty > availableStock) {
        return res.status(409).json({
          success: false,
          code: CART_ERROR.INSUFFICIENT_STOCK,
          message: "Insufficient stock for requested quantity",
          data: { availableStock, requestedQuantity: nextQty },
        });
      }
      existing.quantity = nextQty;
      existing.unit_price_amount = payload.unit_price_amount;
      existing.discount_amount = payload.discount_amount;
      existing.final_unit_price_amount = payload.final_unit_price_amount;
      existing.line_total_amount = existing.final_unit_price_amount * existing.quantity;
      existing.product_name_snapshot = payload.product_name_snapshot;
      existing.variant_name_snapshot = payload.variant_name_snapshot;
      existing.brand_name_snapshot = payload.brand_name_snapshot;
      existing.image_url_snapshot = payload.image_url_snapshot;
      existing.compare_at_price_amount = payload.compare_at_price_amount;
      existing.stock_status = payload.stock_status;
      existing.selected = true;
      existing.line_key = lineKey;
      await existing.save();
    } else {
      await CartItem.create({ ...payload, quantity: qty, line_total_amount: payload.final_unit_price_amount * qty });
    }

    const normalized = await loadNormalizedCart(cart, null);
    return res.status(200).json({
      success: true,
      message: "Item added to guest cart successfully",
      data: { ...normalized, source: "guest", customerId: null, guestSessionId },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/carts/me/items/:itemId/quantity
const updateMyCartItemQuantity = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }

    const { itemId } = req.params;
    const quantity = Math.max(1, Number(req.body?.quantity || 1));
    if (!validateObjectId(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid cart item id" });
    }

    const cart = await ensureActiveCartForCustomer(customer._id);
    const item = await CartItem.findOne({ _id: itemId, cart_id: cart._id }).populate("product_id").populate("variant_id");
    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    const product = item.product_id
      ? await Product.findById(item.product_id).populate("brandId", "brandName")
      : await Product.findById(item.product_id);
    const variant = item.variant_id ? await ProductVariant.findById(item.variant_id) : null;
    if (!variant || variant.variantStatus === "inactive") {
      return res.status(409).json({ success: false, code: CART_ERROR.VARIANT_UNAVAILABLE, message: "Variant is unavailable" });
    }

    if (!product || product.isActive === false || product.productStatus === "inactive") {
      return res.status(409).json({ success: false, code: CART_ERROR.PRODUCT_UNAVAILABLE, message: "Product is unavailable" });
    }

    const availableStock = getAvailableStockForProduct(product);
    if (quantity > availableStock) {
      return res.status(409).json({
        success: false,
        code: CART_ERROR.INSUFFICIENT_STOCK,
        message: "Insufficient stock for requested quantity",
        data: { availableStock, requestedQuantity: quantity },
      });
    }

    item.quantity = quantity;
    applySnapshotPricingFromProduct(item, product);
    await item.save();

    const normalized = await loadNormalizedCart(cart, customer._id);
    return res.status(200).json({ success: true, message: "Cart item quantity updated", data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/carts/guest/items/:itemId/quantity
const updateGuestCartItemQuantity = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    const { itemId } = req.params;
    const quantity = Math.max(1, Number(req.body?.quantity || 1));
    if (!guestSessionId) return res.status(400).json({ success: false, message: "guestSessionId is required" });
    if (!validateObjectId(itemId)) return res.status(400).json({ success: false, message: "Invalid cart item id" });
    const cart = await ensureActiveCartForGuest(guestSessionId);
    const item = await CartItem.findOne({ _id: itemId, cart_id: cart._id }).populate("product_id").populate("variant_id");
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });
    const product = await Product.findById(item.product_id).populate("brandId", "brandName");
    const variant = await ProductVariant.findById(item.variant_id);
    if (!product || product.isActive === false || product.productStatus === "inactive") {
      return res.status(409).json({ success: false, code: CART_ERROR.PRODUCT_UNAVAILABLE, message: "Product is unavailable" });
    }
    if (!variant || variant.variantStatus === "inactive") {
      return res.status(409).json({ success: false, code: CART_ERROR.VARIANT_UNAVAILABLE, message: "Variant is unavailable" });
    }
    const availableStock = getAvailableStockForProduct(product);
    if (quantity > availableStock) {
      return res.status(409).json({ success: false, code: CART_ERROR.INSUFFICIENT_STOCK, message: "Insufficient stock", data: { availableStock } });
    }
    item.quantity = quantity;
    applySnapshotPricingFromProduct(item, product);
    await item.save();
    const normalized = await loadNormalizedCart(cart, null);
    return res.status(200).json({ success: true, message: "Guest cart item updated", data: { ...normalized, source: "guest", customerId: null, guestSessionId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/carts/me/items/:itemId/selection
const toggleMyCartItemSelection = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }
    const { itemId } = req.params;
    const selected = req.body?.selected !== false;
    if (!validateObjectId(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid cart item id" });
    }

    const cart = await ensureActiveCartForCustomer(customer._id);
    const item = await CartItem.findOne({ _id: itemId, cart_id: cart._id });
    if (!item) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    item.selected = selected;
    await item.save();

    const normalized = await loadNormalizedCart(cart, customer._id);
    return res.status(200).json({ success: true, message: "Cart item selection updated", data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleGuestCartItemSelection = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    const { itemId } = req.params;
    const selected = req.body?.selected !== false;
    if (!guestSessionId) return res.status(400).json({ success: false, message: "guestSessionId is required" });
    if (!validateObjectId(itemId)) return res.status(400).json({ success: false, message: "Invalid cart item id" });
    const cart = await ensureActiveCartForGuest(guestSessionId);
    const item = await CartItem.findOne({ _id: itemId, cart_id: cart._id });
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found" });
    item.selected = selected;
    await item.save();
    const normalized = await loadNormalizedCart(cart, null);
    return res.status(200).json({ success: true, message: "Guest selection updated", data: { ...normalized, source: "guest", customerId: null, guestSessionId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/carts/me/selection
const toggleMyCartSelectionAll = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }
    const selected = req.body?.selected !== false;
    const cart = await ensureActiveCartForCustomer(customer._id);
    await CartItem.updateMany({ cart_id: cart._id }, { $set: { selected } });
    const normalized = await loadNormalizedCart(cart, customer._id);
    return res.status(200).json({ success: true, message: "Cart selection updated", data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleGuestCartSelectionAll = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    const selected = req.body?.selected !== false;
    if (!guestSessionId) return res.status(400).json({ success: false, message: "guestSessionId is required" });
    const cart = await ensureActiveCartForGuest(guestSessionId);
    await CartItem.updateMany({ cart_id: cart._id }, { $set: { selected } });
    const normalized = await loadNormalizedCart(cart, null);
    return res.status(200).json({ success: true, message: "Guest selection updated", data: { ...normalized, source: "guest", customerId: null, guestSessionId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/carts/me/items/:itemId
const removeItemFromMyCart = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }
    const { itemId } = req.params;
    if (!validateObjectId(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid cart item id" });
    }
    const cart = await ensureActiveCartForCustomer(customer._id);
    await CartItem.findOneAndDelete({ _id: itemId, cart_id: cart._id });
    const normalized = await loadNormalizedCart(cart, customer._id);
    return res.status(200).json({ success: true, message: "Cart item removed", data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeItemFromGuestCart = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    const { itemId } = req.params;
    if (!guestSessionId) return res.status(400).json({ success: false, message: "guestSessionId is required" });
    if (!validateObjectId(itemId)) return res.status(400).json({ success: false, message: "Invalid cart item id" });
    const cart = await ensureActiveCartForGuest(guestSessionId);
    await CartItem.findOneAndDelete({ _id: itemId, cart_id: cart._id });
    const normalized = await loadNormalizedCart(cart, null);
    return res.status(200).json({ success: true, message: "Guest cart item removed", data: { ...normalized, source: "guest", customerId: null, guestSessionId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/carts/me/items-selected
const removeSelectedFromMyCart = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }
    const cart = await ensureActiveCartForCustomer(customer._id);
    await CartItem.deleteMany({ cart_id: cart._id, selected: true });
    const normalized = await loadNormalizedCart(cart, customer._id);
    return res.status(200).json({ success: true, message: "Selected cart items removed", data: normalized });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeSelectedFromGuestCart = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    if (!guestSessionId) return res.status(400).json({ success: false, message: "guestSessionId is required" });
    const cart = await ensureActiveCartForGuest(guestSessionId);
    await CartItem.deleteMany({ cart_id: cart._id, selected: true });
    const normalized = await loadNormalizedCart(cart, null);
    return res.status(200).json({ success: true, message: "Selected guest items removed", data: { ...normalized, source: "guest", customerId: null, guestSessionId } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carts/me/checkout-prepare
const prepareMyCartCheckout = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }

    const cart = await ensureActiveCartForCustomer(customer._id);
    const items = await CartItem.find({ cart_id: cart._id, selected: true }).populate("product_id").populate("variant_id");
    const issues = [];

    for (const item of items) {
      const product = item.product_id ? await Product.findById(item.product_id) : null;
      const variant = item.variant_id ? await ProductVariant.findById(item.variant_id) : null;

      if (!product || product.isActive === false || product.productStatus === "inactive") {
        issues.push({
          code: CART_ERROR.PRODUCT_UNAVAILABLE,
          cartItemId: String(item._id),
          message: "Product is unavailable",
        });
        continue;
      }

      if (!variant || variant.variantStatus === "inactive") {
        issues.push({
          code: CART_ERROR.VARIANT_UNAVAILABLE,
          cartItemId: String(item._id),
          message: "Variant is unavailable",
        });
        continue;
      }

      const availableStock = getAvailableStockForProduct(product);
      if (Number(item.quantity || 0) > availableStock) {
        issues.push({
          code: CART_ERROR.INSUFFICIENT_STOCK,
          cartItemId: String(item._id),
          message: "Insufficient stock",
          availableStock,
          requestedQuantity: Number(item.quantity || 0),
        });
      }

      const currentUnit = toMoney(product.price || 0);
      const snapshotUnit = toMoney(item.final_unit_price_amount ?? item.unit_price_amount);
      if (currentUnit !== snapshotUnit) {
        issues.push({
          code: CART_ERROR.PRICE_CHANGED,
          cartItemId: String(item._id),
          message: "Price has changed",
          snapshotUnitPrice: snapshotUnit,
          currentUnitPrice: currentUnit,
        });
      }
    }

    const normalized = await loadNormalizedCart(cart, customer._id);
    const ok = issues.length === 0;
    return res.status(ok ? 200 : 409).json({
      success: ok,
      message: ok ? "Cart checkout is ready" : "Cart requires review before checkout",
      data: normalized,
      issues,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/carts/me/merge-guest — merge active guest cart into customer cart, mark guest cart merged
const mergeGuestCartOnLogin = async (req, res) => {
  try {
    const customer = await findCustomerByAuth(req);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found for current account" });
    }

    const guestSessionId = resolveGuestSessionId(req);
    const customerCart = await ensureActiveCartForCustomer(customer._id);

    if (!guestSessionId) {
      const normalized = await loadNormalizedCart(customerCart, customer._id);
      return res.status(200).json({ success: true, message: "No guest session id", data: normalized, merged: false });
    }

    const guestCart = await Cart.findOne({
      owner_type: "guest",
      guest_session_id: guestSessionId,
      cart_status: "active",
    }).sort({ updated_at: -1 });

    if (!guestCart) {
      const normalized = await loadNormalizedCart(customerCart, customer._id);
      return res.status(200).json({ success: true, message: "No guest cart to merge", data: normalized, merged: false });
    }

    const guestItems = await CartItem.find({ cart_id: guestCart._id }).sort({ added_at: -1 });
    if (!guestItems.length) {
      await Cart.findByIdAndUpdate(guestCart._id, {
        cart_status: "merged",
        item_count: 0,
        subtotal_amount: 0,
        discount_amount: 0,
        total_amount: 0,
      });
      const normalized = await loadNormalizedCart(customerCart, customer._id);
      return res.status(200).json({ success: true, message: "Guest cart was empty", data: normalized, merged: false });
    }

    for (const gi of guestItems) {
      const product = await Product.findById(gi.product_id).populate("brandId", "brandName");
      const variant = gi.variant_id ? await ProductVariant.findById(gi.variant_id) : null;
      if (!product || !variant || product.isActive === false || product.productStatus === "inactive" || variant.variantStatus === "inactive") {
        continue;
      }

      const availableStock = getAvailableStockForProduct(product);
      if (availableStock <= 0) continue;

      const lineKey = buildLineKey(product._id, variant._id);
      const existing = await CartItem.findOne({
        cart_id: customerCart._id,
        $or: [{ line_key: lineKey }, { product_id: product._id, variant_id: variant._id }],
      });

      const unitPrice = Number(product.price || 0);
      const finalUnit = unitPrice;
      const compareRaw = toMoney(gi.compare_at_price_amount || 0);
      const payload = {
        product_id: product._id,
        cart_id: customerCart._id,
        variant_id: variant._id,
        sku_snapshot: variant.sku || product.productCode || String(product._id),
        product_name_snapshot: product.productName || "Product",
        variant_name_snapshot: variant.variantName || "Default",
        brand_name_snapshot: product.brandId?.brandName || "",
        image_url_snapshot: product.imageUrl || "",
        compare_at_price_amount: compareRaw > finalUnit ? compareRaw : 0,
        stock_status: Number(product.stock || 0) > 0 ? "in_stock" : "out_of_stock",
        unit_price_amount: unitPrice,
        discount_amount: 0,
        final_unit_price_amount: finalUnit,
        selected: gi.selected !== false,
        line_key: lineKey,
      };

      const guestQty = Math.max(1, Number(gi.quantity || 1));

      if (existing) {
        const nextQty = Math.max(1, Number(existing.quantity || 1) + guestQty);
        const cappedQty = Math.min(nextQty, availableStock);
        existing.quantity = cappedQty;
        existing.unit_price_amount = payload.unit_price_amount;
        existing.discount_amount = payload.discount_amount;
        existing.final_unit_price_amount = payload.final_unit_price_amount;
        existing.line_total_amount = existing.final_unit_price_amount * existing.quantity;
        existing.product_name_snapshot = payload.product_name_snapshot;
        existing.variant_name_snapshot = payload.variant_name_snapshot;
        existing.brand_name_snapshot = payload.brand_name_snapshot;
        existing.image_url_snapshot = payload.image_url_snapshot;
        existing.compare_at_price_amount = payload.compare_at_price_amount;
        existing.stock_status = payload.stock_status;
        existing.line_key = lineKey;
        await existing.save();
      } else {
        const qty = Math.min(guestQty, availableStock);
        if (qty < 1) continue;
        await CartItem.create({
          ...payload,
          quantity: qty,
          line_total_amount: payload.final_unit_price_amount * qty,
        });
      }
    }

    await CartItem.deleteMany({ cart_id: guestCart._id });
    await Cart.findByIdAndUpdate(guestCart._id, {
      cart_status: "merged",
      item_count: 0,
      subtotal_amount: 0,
      discount_amount: 0,
      total_amount: 0,
    });

    const normalized = await loadNormalizedCart(customerCart, customer._id);
    return res.status(200).json({ success: true, message: "Guest cart merged into your cart", data: normalized, merged: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const prepareGuestCartCheckout = async (req, res) => {
  try {
    const guestSessionId = resolveGuestSessionId(req);
    if (!guestSessionId) return res.status(400).json({ success: false, message: "guestSessionId is required" });
    const cart = await ensureActiveCartForGuest(guestSessionId);
    const items = await CartItem.find({ cart_id: cart._id, selected: true }).populate("product_id").populate("variant_id");
    const issues = [];
    for (const item of items) {
      const product = item.product_id ? await Product.findById(item.product_id) : null;
      const variant = item.variant_id ? await ProductVariant.findById(item.variant_id) : null;
      if (!product || product.isActive === false || product.productStatus === "inactive") {
        issues.push({ code: CART_ERROR.PRODUCT_UNAVAILABLE, cartItemId: String(item._id), message: "Product is unavailable" });
        continue;
      }
      if (!variant || variant.variantStatus === "inactive") {
        issues.push({ code: CART_ERROR.VARIANT_UNAVAILABLE, cartItemId: String(item._id), message: "Variant is unavailable" });
        continue;
      }
      const availableStock = getAvailableStockForProduct(product);
      if (Number(item.quantity || 0) > availableStock) {
        issues.push({ code: CART_ERROR.INSUFFICIENT_STOCK, cartItemId: String(item._id), message: "Insufficient stock", availableStock });
      }
    }
    const normalized = await loadNormalizedCart(cart, null);
    return res.status(issues.length ? 409 : 200).json({
      success: issues.length === 0,
      message: issues.length ? "Guest cart requires review before checkout" : "Guest cart checkout is ready",
      data: { ...normalized, source: "guest", customerId: null, guestSessionId },
      issues,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
  mergeGuestCartOnLogin,
  buildEmptyNormalizedCart,
};
