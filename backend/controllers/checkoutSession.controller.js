const CheckoutSession = require("../models/checkoutSession.model");
const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");
const Customer = require("../models/customer.model");
const Account = require("../models/account.model");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const Coupon = require("../models/coupon.model");
const Promotion = require("../models/promotion.model");
const ShippingMethod = require("../models/shippingMethod.model");
const PaymentMethod = require("../models/paymentMethod.model");
const CheckoutAddress = require("../models/checkoutAddress.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderAddress = require("../models/orderAddress.model");
const OrderTotal = require("../models/orderTotal.model");
const PaymentIntent = require("../models/paymentIntent.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");
const { normalizeCheckoutSessionBody } = require("../utils/cartCheckoutNormalize");
const { computeCartSummary } = require("../utils/cartSummary");

const CUST = "customer_code full_name";
const CHECKOUT_ERROR = {
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  VARIANT_UNAVAILABLE: "VARIANT_UNAVAILABLE",
  PRICE_CHANGED: "PRICE_CHANGED",
  INVALID_ADDRESS: "INVALID_ADDRESS",
  INVALID_SHIPPING_METHOD: "INVALID_SHIPPING_METHOD",
  INVALID_PAYMENT_METHOD: "INVALID_PAYMENT_METHOD",
  PAYMENT_PENDING: "PAYMENT_PENDING",
};

const toMoney = (v) => Math.max(0, Math.round(Number(v || 0)));
const buildLineKey = (productId, variantId) => `${String(productId)}::${String(variantId || "default")}`;

const generateCustomerCode = async () => {
  const base = await Customer.countDocuments();
  for (let i = 1; i < 9999; i += 1) {
    const code = `CUS${String(base + i).padStart(4, "0")}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Customer.findOne({ customer_code: code }).select("_id").lean();
    if (!exists) return code;
  }
  return `CUS${Date.now()}`;
};

const resolveAuthCustomer = async (req) => {
  const accountId = req.user?.account_id || req.user?.accountId;
  if (!accountId || !validateObjectId(accountId)) return null;

  let customer = await Customer.findOne({ account_id: accountId });
  if (customer) return customer;

  const account = await Account.findById(accountId).select("_id account_type email username");
  if (!account) return null;
  customer = await Customer.create({
    account_id: account._id,
    customer_code: await generateCustomerCode(),
    full_name: account.username || account.email || "Customer",
    first_name: "",
    last_name: "",
    customer_status: "active",
  });
  return customer;
};

const ensureActiveCart = async (customerId) => {
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

const createBuyNowCart = async (customerId) => {
  return Cart.create({
    customer_id: customerId,
    cart_status: "converted",
    currency_code: "VND",
    item_count: 0,
    subtotal_amount: 0,
    discount_amount: 0,
    total_amount: 0,
  });
};

const expireInProgressSessions = async (customerId) => {
  await CheckoutSession.updateMany(
    { customer_id: customerId, checkout_status: "in_progress" },
    { $set: { checkout_status: "expired" } }
  );
};

const resolveBuyNowVariant = async (productId, variantId) => {
  let variant = null;
  if (variantId && validateObjectId(variantId)) {
    variant = await ProductVariant.findOne({ _id: variantId, productId });
  }
  if (!variant) {
    variant = await ProductVariant.findOne({ productId, variantStatus: "active" }).sort({ createdAt: 1 });
  }
  if (!variant) {
    variant = await ProductVariant.findOne({ productId }).sort({ createdAt: 1 });
  }
  return variant;
};

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
    return ProductVariant.findOne({ productId }).sort({ createdAt: 1 });
  }
};

const createBuyNowSnapshotItem = async ({ cartId, product, variant, quantity }) => {
  const unitPrice = toMoney(product.price || 0);
  const qty = Math.max(1, Number(quantity || 1));
  const lineTotal = unitPrice * qty;
  const lineKey = `${buildLineKey(product._id, variant._id)}::buy_now`;
  const stockStatus = Number(product.stock || 0) > 0 ? "in_stock" : "out_of_stock";

  return CartItem.create({
    line_key: lineKey,
    product_id: product._id,
    cart_id: cartId,
    variant_id: variant._id,
    sku_snapshot: variant.sku || product.productCode || String(product._id),
    product_name_snapshot: product.productName || "Product",
    variant_name_snapshot: variant.variantName || "Default",
    brand_name_snapshot: product.brandId?.brandName || "",
    image_url_snapshot: product.imageUrl || "",
    compare_at_price_amount: toMoney(product.compareAtPrice || 0),
    stock_status: stockStatus,
    quantity: qty,
    selected: true,
    unit_price_amount: unitPrice,
    discount_amount: 0,
    final_unit_price_amount: unitPrice,
    line_total_amount: lineTotal,
  });
};

const validateSelectedItems = async (selectedItems) => {
  const issues = [];
  const enriched = [];

  for (const item of selectedItems) {
    // eslint-disable-next-line no-await-in-loop
    const product = await Product.findById(item.product_id).populate("brandId", "brandName");
    // eslint-disable-next-line no-await-in-loop
    const variant = await ProductVariant.findById(item.variant_id);

    if (!product || product.isActive === false || product.productStatus === "inactive") {
      issues.push({ code: CHECKOUT_ERROR.PRODUCT_UNAVAILABLE, cartItemId: String(item._id), message: "Product is unavailable" });
      continue;
    }
    if (!variant || variant.variantStatus === "inactive") {
      issues.push({ code: CHECKOUT_ERROR.VARIANT_UNAVAILABLE, cartItemId: String(item._id), message: "Variant is unavailable" });
      continue;
    }

    const stock = Math.max(0, Number(product.stock || 0));
    const qty = Math.max(1, Number(item.quantity || 1));
    if (qty > stock) {
      issues.push({
        code: CHECKOUT_ERROR.INSUFFICIENT_STOCK,
        cartItemId: String(item._id),
        message: "Insufficient stock",
        availableStock: stock,
        requestedQuantity: qty,
      });
    }

    const snapshotPrice = toMoney(item.final_unit_price_amount ?? item.unit_price_amount);
    const currentPrice = toMoney(product.price || 0);
    if (snapshotPrice !== currentPrice) {
      issues.push({
        code: CHECKOUT_ERROR.PRICE_CHANGED,
        cartItemId: String(item._id),
        message: "Price has changed",
        snapshotUnitPrice: snapshotPrice,
        currentUnitPrice: currentPrice,
      });
    }

    enriched.push({ item, product, variant, currentPrice, snapshotPrice });
  }

  return { issues, enriched };
};

const calcCouponDiscount = async (couponCode, subtotal) => {
  if (!couponCode) return { discount: 0, appliedCouponCode: null };
  const code = String(couponCode).trim().toUpperCase();
  if (!code) return { discount: 0, appliedCouponCode: null };

  const coupon = await Coupon.findOne({ couponCode: code, couponStatus: "active" }).lean();
  if (!coupon) return { error: { code: "INVALID_COUPON", message: "Coupon is invalid or inactive" } };

  const now = new Date();
  if (coupon.validFrom && new Date(coupon.validFrom) > now) return { error: { code: "INVALID_COUPON", message: "Coupon is not active yet" } };
  if (coupon.validTo && new Date(coupon.validTo) < now) return { error: { code: "INVALID_COUPON", message: "Coupon has expired" } };
  if (Number(coupon.minOrderAmount || 0) > subtotal) {
    return { error: { code: "INVALID_COUPON", message: "Order does not meet minimum amount for coupon" } };
  }

  const promotion = coupon.promotionId ? await Promotion.findById(coupon.promotionId).lean() : null;
  if (!promotion || promotion.promotionStatus !== "active") return { error: { code: "INVALID_COUPON", message: "Promotion is unavailable" } };

  let discount = 0;
  if (promotion.discountType === "percentage") {
    discount = Math.round((subtotal * Number(promotion.discountValue || 0)) / 100);
    const cap = Number(promotion.maxDiscountAmount || 0);
    if (cap > 0) discount = Math.min(discount, cap);
  } else {
    discount = toMoney(promotion.discountValue || 0);
  }
  return { discount: Math.min(discount, subtotal), appliedCouponCode: code };
};

const toCheckoutSessionPayload = async (session) => {
  const selectedItems = await CartItem.find({ cart_id: session.cart_id, selected: true }).sort({ added_at: -1 });
  const shippingAddress = session.selected_shipping_address_id
    ? await CheckoutAddress.findById(session.selected_shipping_address_id).lean()
    : null;
  return {
    sessionId: String(session._id),
    checkoutStatus: session.checkout_status,
    cartId: String(session.cart_id),
    customerId: String(session.customer_id),
    shippingAddress,
    selectedShippingMethodId: session.selected_shipping_method_id ? String(session.selected_shipping_method_id) : null,
    selectedPaymentMethodId: session.selected_payment_method_id ? String(session.selected_payment_method_id) : null,
    subtotal: toMoney(session.subtotal_amount),
    shippingFee: toMoney(session.shipping_fee_amount),
    discount: toMoney(session.discount_amount),
    total: toMoney(session.total_amount),
    expiresAt: session.expires_at,
    selectedItems: selectedItems.map((item) => ({
      cartItemId: String(item._id),
      productId: String(item.product_id),
      variantId: String(item.variant_id),
      productName: item.product_name_snapshot,
      variantName: item.variant_name_snapshot,
      imageUrl: item.image_url_snapshot || "",
      quantity: Number(item.quantity || 1),
      unitPrice: toMoney(item.final_unit_price_amount ?? item.unit_price_amount),
      lineTotal: toMoney(item.line_total_amount || 0),
    })),
  };
};

// GET /api/checkout-sessions/me/:id
const getMyCheckoutSessionById = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required for checkout" });

    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid session id" });

    const session = await CheckoutSession.findById(id);
    if (!session || String(session.customer_id) !== String(customer._id)) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    const payload = await toCheckoutSessionPayload(session);
    return res.status(200).json({ success: true, message: "Checkout session loaded", data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-sessions
const getAllCheckoutSessions = async (req, res) => {
  try {
    const sessions = await CheckoutSession.find()
      .populate("cart_id", "cart_status item_count total_amount")
      .populate("customer_id", CUST)
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all checkout sessions successfully",
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-sessions/:id
const getCheckoutSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const session = await CheckoutSession.findById(id)
      .populate("cart_id", "cart_status item_count total_amount")
      .populate("customer_id", CUST)
      .populate("selected_shipping_address_id")
      .populate("selected_billing_address_id")
      .populate("selected_shipping_method_id")
      .populate("selected_payment_method_id");

    if (!session) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get checkout session successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-sessions/cart/:cart_id
const getSessionsByCartId = async (req, res) => {
  try {
    const cart_id = req.params.cart_id ?? req.params.cartId;

    if (!validateObjectId(cart_id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const sessions = await CheckoutSession.find({ cart_id })
      .populate("customer_id", CUST)
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get sessions by cart successfully",
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/checkout-sessions
const createCheckoutSession = async (req, res) => {
  try {
    const body = normalizeCheckoutSessionBody(req.body);
    const cart_id = body.cart_id ?? req.body.cartId;
    const customer_id = pickCustomerId(req.body);

    if (!cart_id || !customer_id) {
      return res.status(400).json({
        success: false,
        message: "cart_id and customer_id are required",
      });
    }

    if (!validateObjectId(cart_id)) {
      return res.status(400).json({ success: false, message: "Invalid cart_id" });
    }
    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer_id" });
    }

    const cartExists = await Cart.findById(cart_id);
    if (!cartExists) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (body.subtotal_amount === undefined && cartExists.subtotal_amount != null) {
      body.subtotal_amount = cartExists.subtotal_amount;
    }

    const sub = body.subtotal_amount || 0;
    const ship = body.shipping_fee_amount || 0;
    const tax = body.tax_amount || 0;
    const disc = body.discount_amount || 0;
    body.total_amount = sub + ship + tax - disc;

    const payload = { ...body, cart_id, customer_id };
    delete payload.customerId;
    delete payload.cartId;

    const session = await CheckoutSession.create(payload);

    res.status(201).json({
      success: true,
      message: "Checkout session created successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/checkout-sessions/:id
const updateCheckoutSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const existing = await CheckoutSession.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    const body = normalizeCheckoutSessionBody(req.body);
    const sub =
      body.subtotal_amount !== undefined ? body.subtotal_amount : existing.subtotal_amount;
    const ship =
      body.shipping_fee_amount !== undefined ? body.shipping_fee_amount : existing.shipping_fee_amount;
    const tax = body.tax_amount !== undefined ? body.tax_amount : existing.tax_amount;
    const disc = body.discount_amount !== undefined ? body.discount_amount : existing.discount_amount;
    body.total_amount = sub + ship + tax - disc;

    const session = await CheckoutSession.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Checkout session updated successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/checkout-sessions/:id
const deleteCheckoutSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const session = await CheckoutSession.findByIdAndDelete(id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    res.status(200).json({
      success: true,
      message: "Checkout session deleted successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/checkout-sessions/me
const createMyCheckoutSession = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required for checkout" });

    const cart = await ensureActiveCart(customer._id);
    const selectedItems = await CartItem.find({ cart_id: cart._id, selected: true }).sort({ added_at: -1 });
    if (!selectedItems.length) {
      return res.status(400).json({ success: false, message: "No selected cart items to checkout" });
    }

    const { issues } = await validateSelectedItems(selectedItems);
    if (issues.length) {
      return res.status(409).json({ success: false, message: "Checkout prepare failed", issues });
    }

    const summary = computeCartSummary(selectedItems);
    const shippingMethodId = req.body?.shippingMethodId || req.body?.selectedShippingMethodId || null;
    const paymentMethodId = req.body?.paymentMethodId || req.body?.selectedPaymentMethodId || null;
    const couponCode = req.body?.couponCode || null;

    let shippingFee = toMoney(summary.shippingFee);
    let selectedShippingMethod = null;
    if (shippingMethodId && validateObjectId(shippingMethodId)) {
      selectedShippingMethod = await ShippingMethod.findById(shippingMethodId).lean();
      if (!selectedShippingMethod || selectedShippingMethod.is_active === false) {
        return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_SHIPPING_METHOD, message: "Invalid shipping method" });
      }
      const serviceLevel = String(selectedShippingMethod.service_level || "").toLowerCase();
      shippingFee = serviceLevel.includes("express") ? 45000 : 30000;
      if (summary.qualifiesForFreeShipping) shippingFee = 0;
    }

    let selectedPaymentMethod = null;
    if (paymentMethodId && validateObjectId(paymentMethodId)) {
      selectedPaymentMethod = await PaymentMethod.findById(paymentMethodId).lean();
      if (!selectedPaymentMethod || selectedPaymentMethod.is_active === false) {
        return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_PAYMENT_METHOD, message: "Invalid payment method" });
      }
    }

    const couponResult = await calcCouponDiscount(couponCode, toMoney(summary.subtotal));
    if (couponResult.error) return res.status(400).json({ success: false, ...couponResult.error });

    const discountAmount = toMoney(summary.discountTotal) + toMoney(couponResult.discount);
    const totalAmount = Math.max(0, toMoney(summary.subtotal) - discountAmount + shippingFee);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const session = await CheckoutSession.create({
      cart_id: cart._id,
      customer_id: customer._id,
      checkout_status: "in_progress",
      currency_code: "VND",
      selected_shipping_method_id: selectedShippingMethod?._id || null,
      selected_payment_method_id: selectedPaymentMethod?._id || null,
      subtotal_amount: toMoney(summary.subtotal),
      shipping_fee_amount: shippingFee,
      discount_amount: discountAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      expires_at: expiresAt,
    });

    const shippingAddress = req.body?.shippingAddress;
    if (shippingAddress?.recipientName && shippingAddress?.phone && shippingAddress?.addressLine1 && shippingAddress?.city) {
      const address = await CheckoutAddress.create({
        checkout_session_id: session._id,
        address_type: "shipping",
        recipient_name: shippingAddress.recipientName,
        phone: shippingAddress.phone,
        address_line_1: shippingAddress.addressLine1,
        address_line_2: shippingAddress.addressLine2 || "",
        ward: shippingAddress.ward || "",
        district: shippingAddress.district || "",
        city: shippingAddress.city,
        country_code: shippingAddress.countryCode || "VN",
        postal_code: shippingAddress.postalCode || "",
        is_selected: true,
      });
      session.selected_shipping_address_id = address._id;
      await session.save();
    }

    const payload = await toCheckoutSessionPayload(session);
    return res.status(201).json({
      success: true,
      message: "Checkout session created",
      data: { ...payload, appliedCouponCode: couponResult.appliedCouponCode || null },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/checkout-sessions/me/buy-now
const createMyBuyNowCheckoutSession = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required for checkout" });

    const productId = String(req.body?.productId || "").trim();
    const variantIdRaw = req.body?.variantId;
    const variantId = variantIdRaw == null ? null : String(variantIdRaw).trim();
    const quantity = Number(req.body?.quantity || 1);

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }
    if (variantId && !validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }

    const product = await Product.findById(productId).populate("brandId", "brandName");
    if (!product || product.isActive === false || product.productStatus === "inactive") {
      return res.status(409).json({
        success: false,
        code: CHECKOUT_ERROR.PRODUCT_UNAVAILABLE,
        message: "Sản phẩm hiện không còn khả dụng.",
      });
    }

    let variant = await resolveBuyNowVariant(product._id, variantId);
    if (!variant) {
      variant = await ensureDefaultVariantForProduct(product);
    }
    if (!variant || variant.variantStatus === "inactive") {
      return res.status(409).json({
        success: false,
        code: CHECKOUT_ERROR.VARIANT_UNAVAILABLE,
        message: "Phân loại này hiện không còn khả dụng.",
      });
    }

    const stock = Math.max(0, Number(product.stock || 0));
    const qty = Math.max(1, Math.round(quantity));
    if (qty > stock) {
      return res.status(409).json({
        success: false,
        code: CHECKOUT_ERROR.INSUFFICIENT_STOCK,
        message: "Số lượng vượt quá tồn kho hiện tại.",
        availableStock: stock,
        requestedQuantity: qty,
      });
    }

    await expireInProgressSessions(customer._id);

    const cart = await createBuyNowCart(customer._id);
    const buyNowItem = await createBuyNowSnapshotItem({
      cartId: cart._id,
      product,
      variant,
      quantity: qty,
    });
    const summary = computeCartSummary([buyNowItem]);

    await Cart.findByIdAndUpdate(cart._id, {
      item_count: summary.itemCount,
      subtotal_amount: summary.subtotal,
      discount_amount: summary.discountTotal,
      total_amount: summary.grandTotal,
    });

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const session = await CheckoutSession.create({
      cart_id: cart._id,
      customer_id: customer._id,
      checkout_status: "in_progress",
      currency_code: "VND",
      subtotal_amount: toMoney(summary.subtotal),
      shipping_fee_amount: toMoney(summary.shippingFee),
      discount_amount: toMoney(summary.discountTotal),
      tax_amount: 0,
      total_amount: toMoney(summary.grandTotal),
      expires_at: expiresAt,
    });

    const payload = await toCheckoutSessionPayload(session);
    return res.status(201).json({
      success: true,
      message: "Buy now checkout session created",
      data: payload,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/checkout-sessions/:id
const updateMyCheckoutSession = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required for checkout" });

    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid session id" });

    const session = await CheckoutSession.findById(id);
    if (!session || String(session.customer_id) !== String(customer._id)) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }
    if (session.checkout_status !== "in_progress") {
      return res.status(409).json({ success: false, message: "Checkout session is not editable" });
    }

    const selectedItems = await CartItem.find({ cart_id: session.cart_id, selected: true }).sort({ added_at: -1 });
    if (!selectedItems.length) {
      return res.status(400).json({ success: false, message: "No selected cart items to checkout" });
    }
    const { issues } = await validateSelectedItems(selectedItems);
    if (issues.length) return res.status(409).json({ success: false, message: "Checkout prepare failed", issues });

    const summary = computeCartSummary(selectedItems);
    const shippingMethodId = req.body?.shippingMethodId || req.body?.selectedShippingMethodId || session.selected_shipping_method_id;
    const paymentMethodId = req.body?.paymentMethodId || req.body?.selectedPaymentMethodId || session.selected_payment_method_id;
    const couponCode = req.body?.couponCode || null;

    let shippingFee = toMoney(summary.shippingFee);
    if (shippingMethodId) {
      if (!validateObjectId(String(shippingMethodId))) {
        return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_SHIPPING_METHOD, message: "Invalid shipping method" });
      }
      const shippingMethod = await ShippingMethod.findById(shippingMethodId).lean();
      if (!shippingMethod || shippingMethod.is_active === false) {
        return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_SHIPPING_METHOD, message: "Invalid shipping method" });
      }
      const serviceLevel = String(shippingMethod.service_level || "").toLowerCase();
      shippingFee = serviceLevel.includes("express") ? 45000 : 30000;
      if (summary.qualifiesForFreeShipping) shippingFee = 0;
      session.selected_shipping_method_id = shippingMethod._id;
    }

    if (paymentMethodId) {
      if (!validateObjectId(String(paymentMethodId))) {
        return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_PAYMENT_METHOD, message: "Invalid payment method" });
      }
      const paymentMethod = await PaymentMethod.findById(paymentMethodId).lean();
      if (!paymentMethod || paymentMethod.is_active === false) {
        return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_PAYMENT_METHOD, message: "Invalid payment method" });
      }
      session.selected_payment_method_id = paymentMethod._id;
    }

    const couponResult = await calcCouponDiscount(couponCode, toMoney(summary.subtotal));
    if (couponResult.error) return res.status(400).json({ success: false, ...couponResult.error });

    const shippingAddress = req.body?.shippingAddress;
    if (shippingAddress) {
      if (!shippingAddress.recipientName || !shippingAddress.phone || !shippingAddress.addressLine1 || !shippingAddress.city) {
        return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_ADDRESS, message: "Invalid shipping address" });
      }
      let selectedAddress = session.selected_shipping_address_id
        ? await CheckoutAddress.findById(session.selected_shipping_address_id)
        : null;
      if (!selectedAddress) {
        selectedAddress = await CheckoutAddress.create({
          checkout_session_id: session._id,
          address_type: "shipping",
          recipient_name: shippingAddress.recipientName,
          phone: shippingAddress.phone,
          address_line_1: shippingAddress.addressLine1,
          address_line_2: shippingAddress.addressLine2 || "",
          ward: shippingAddress.ward || "",
          district: shippingAddress.district || "",
          city: shippingAddress.city,
          country_code: shippingAddress.countryCode || "VN",
          postal_code: shippingAddress.postalCode || "",
          is_selected: true,
        });
      } else {
        selectedAddress.recipient_name = shippingAddress.recipientName;
        selectedAddress.phone = shippingAddress.phone;
        selectedAddress.address_line_1 = shippingAddress.addressLine1;
        selectedAddress.address_line_2 = shippingAddress.addressLine2 || "";
        selectedAddress.ward = shippingAddress.ward || "";
        selectedAddress.district = shippingAddress.district || "";
        selectedAddress.city = shippingAddress.city;
        selectedAddress.country_code = shippingAddress.countryCode || "VN";
        selectedAddress.postal_code = shippingAddress.postalCode || "";
        await selectedAddress.save();
      }
      session.selected_shipping_address_id = selectedAddress._id;
    }

    const discountAmount = toMoney(summary.discountTotal) + toMoney(couponResult.discount);
    session.subtotal_amount = toMoney(summary.subtotal);
    session.shipping_fee_amount = shippingFee;
    session.discount_amount = discountAmount;
    session.tax_amount = 0;
    session.total_amount = Math.max(0, toMoney(summary.subtotal) - discountAmount + shippingFee);
    session.expires_at = new Date(Date.now() + 30 * 60 * 1000);
    await session.save();

    const payload = await toCheckoutSessionPayload(session);
    return res.status(200).json({
      success: true,
      message: "Checkout session updated",
      data: { ...payload, appliedCouponCode: couponResult.appliedCouponCode || null },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/checkout-sessions/:id/place-order
const placeMyCheckoutSessionOrder = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required for checkout" });

    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid session id" });

    const session = await CheckoutSession.findById(id);
    if (!session || String(session.customer_id) !== String(customer._id)) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }
    if (session.checkout_status !== "in_progress") {
      return res.status(409).json({ success: false, message: "Checkout session is not active" });
    }

    const selectedItems = await CartItem.find({ cart_id: session.cart_id, selected: true }).sort({ added_at: -1 });
    if (!selectedItems.length) {
      return res.status(400).json({ success: false, message: "No selected cart items to place order" });
    }

    const { issues, enriched } = await validateSelectedItems(selectedItems);
    if (issues.length) return res.status(409).json({ success: false, message: "Checkout requires review", issues });

    const shippingAddress = session.selected_shipping_address_id
      ? await CheckoutAddress.findById(session.selected_shipping_address_id)
      : null;
    if (!shippingAddress) {
      return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_ADDRESS, message: "Shipping address is required" });
    }

    if (!session.selected_payment_method_id || !validateObjectId(String(session.selected_payment_method_id))) {
      return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_PAYMENT_METHOD, message: "Payment method is required" });
    }
    const paymentMethod = await PaymentMethod.findById(session.selected_payment_method_id).lean();
    if (!paymentMethod || paymentMethod.is_active === false) {
      return res.status(400).json({ success: false, code: CHECKOUT_ERROR.INVALID_PAYMENT_METHOD, message: "Invalid payment method" });
    }

    const ts = Date.now().toString().slice(-8);
    const orderNumber = `ORD${ts}`;
    const isCod = String(paymentMethod.method_type || "").toLowerCase().includes("cod");
    const orderStatus = isCod ? "confirmed" : "pending";
    const paymentStatus = "unpaid";

    const order = await Order.create({
      order_number: orderNumber,
      customer_id: customer._id,
      checkout_session_id: session._id,
      currency_code: "VND",
      order_status: orderStatus,
      payment_status: paymentStatus,
      fulfillment_status: "unfulfilled",
      customer_note: req.body?.customerNote || "",
      placed_at: new Date(),
      confirmed_at: isCod ? new Date() : null,
    });

    for (const info of enriched) {
      const item = info.item;
      const unit = toMoney(item.final_unit_price_amount ?? item.unit_price_amount);
      const qty = Math.max(1, Number(item.quantity || 1));
      const lineTotal = unit * qty;
      // eslint-disable-next-line no-await-in-loop
      await OrderItem.create({
        order_id: order._id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        sku_snapshot: item.sku_snapshot || info.variant?.sku || String(item.variant_id),
        product_name_snapshot: item.product_name_snapshot || info.product?.productName || "Product",
        variant_name_snapshot: item.variant_name_snapshot || info.variant?.variantName || "Default",
        quantity: qty,
        unit_list_price_amount: toMoney(item.compare_at_price_amount || unit),
        unit_sale_price_amount: unit,
        unit_final_price_amount: unit,
        line_subtotal_amount: unit * qty,
        line_discount_amount: 0,
        line_total_amount: lineTotal,
        currency_code: "VND",
      });
    }

    await OrderAddress.create({
      order_id: order._id,
      address_type: "shipping",
      recipient_name: shippingAddress.recipient_name,
      phone: shippingAddress.phone,
      address_line_1: shippingAddress.address_line_1,
      address_line_2: shippingAddress.address_line_2 || "",
      ward: shippingAddress.ward || "",
      district: shippingAddress.district || "",
      city: shippingAddress.city,
      country_code: shippingAddress.country_code || "VN",
      postal_code: shippingAddress.postal_code || "",
      created_at: new Date(),
    });

    await OrderAddress.create({
      order_id: order._id,
      address_type: "billing",
      recipient_name: shippingAddress.recipient_name,
      phone: shippingAddress.phone,
      address_line_1: shippingAddress.address_line_1,
      address_line_2: shippingAddress.address_line_2 || "",
      ward: shippingAddress.ward || "",
      district: shippingAddress.district || "",
      city: shippingAddress.city,
      country_code: shippingAddress.country_code || "VN",
      postal_code: shippingAddress.postal_code || "",
      created_at: new Date(),
    });

    const subtotal = toMoney(session.subtotal_amount);
    const discount = toMoney(session.discount_amount);
    const shippingFee = toMoney(session.shipping_fee_amount);
    const grandTotal = Math.max(0, subtotal - discount + shippingFee);

    await OrderTotal.create({
      order_id: order._id,
      subtotal_amount: subtotal,
      item_discount_amount: 0,
      order_discount_amount: discount,
      shipping_fee_amount: shippingFee,
      tax_amount: 0,
      grand_total_amount: grandTotal,
      refunded_amount: 0,
      currency_code: "VND",
    });

    let paymentIntent = null;
    let paymentTransaction = null;
    if (!isCod) {
      paymentIntent = await PaymentIntent.create({
        order_id: order._id,
        payment_method_id: paymentMethod._id,
        providerCode: paymentMethod.provider_code || "MOCK",
        providerPaymentIntentId: `mock_${orderNumber}`,
        requestedAmount: grandTotal,
        authorizedAmount: 0,
        capturedAmount: 0,
        currencyCode: "VND",
        intentStatus: "pending",
      });
      paymentTransaction = await PaymentTransaction.create({
        paymentIntentId: paymentIntent._id,
        order_id: order._id,
        transactionType: "authorize",
        providerTransactionId: `mock_txn_${orderNumber}`,
        transactionStatus: "pending",
        amount: grandTotal,
        currencyCode: "VND",
        processedAt: new Date(),
        rawResponseJson: JSON.stringify({ mode: "placeholder_pending_manual_update" }),
      });
    }

    session.checkout_status = "completed";
    await session.save();

    await CartItem.deleteMany({ cart_id: session.cart_id, selected: true });
    const remain = await CartItem.find({ cart_id: session.cart_id });
    const newSummary = computeCartSummary(remain);
    await Cart.findByIdAndUpdate(session.cart_id, {
      item_count: newSummary.itemCount,
      subtotal_amount: newSummary.subtotal,
      discount_amount: newSummary.discountTotal,
      total_amount: newSummary.grandTotal,
    });

    return res.status(201).json({
      success: true,
      message: isCod ? "Order placed successfully" : "Order created. Payment is pending confirmation",
      code: isCod ? undefined : CHECKOUT_ERROR.PAYMENT_PENDING,
      data: {
        orderId: String(order._id),
        orderNumber: order.order_number,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        checkoutSessionId: String(session._id),
        paymentIntentId: paymentIntent ? String(paymentIntent._id) : null,
        paymentTransactionId: paymentTransaction ? String(paymentTransaction._id) : null,
        cartSummary: newSummary,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCheckoutSessions,
  getCheckoutSessionById,
  getSessionsByCartId,
  createCheckoutSession,
  updateCheckoutSession,
  deleteCheckoutSession,
  createMyCheckoutSession,
  createMyBuyNowCheckoutSession,
  getMyCheckoutSessionById,
  updateMyCheckoutSession,
  placeMyCheckoutSessionOrder,
};
