const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderAddress = require("../models/orderAddress.model");
const OrderTotal = require("../models/orderTotal.model");
const Customer = require("../models/customer.model");
const OrderStatusHistory = require("../models/orderStatusHistory.model");
const Account = require("../models/account.model");
const Shipment = require("../models/shipment.model");
const ShipmentEvent = require("../models/shipmentEvent.model");
const PaymentIntent = require("../models/paymentIntent.model");
const PaymentMethod = require("../models/paymentMethod.model");
const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const ReturnRequest = require("../models/return.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");
const { normalizeOrderBody } = require("../utils/orderNormalize");
const { validateStatusTransition } = require("../utils/orderStatusGuard");

const CUST_POP = "customer_code full_name account_id";
const CUST_POP_SHORT = "customer_code full_name";

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

const recalcCartTotals = async (cartId) => {
  const items = await CartItem.find({ cart_id: cartId }).lean();
  const itemCount = items.length;
  const subtotal = items.reduce((s, x) => s + Number(x.unit_price_amount || 0) * Number(x.quantity || 0), 0);
  const discount = items.reduce((s, x) => s + Number(x.discount_amount || 0), 0);
  const total = items.reduce((s, x) => s + Number(x.line_total_amount || 0), 0);
  await Cart.findByIdAndUpdate(cartId, {
    item_count: itemCount,
    subtotal_amount: subtotal,
    discount_amount: discount,
    total_amount: total,
  });
};

const formatMoneyInt = (v) => Math.max(0, Math.round(Number(v || 0)));

const generateReturnNumber = async () => {
  const base = await ReturnRequest.countDocuments();
  for (let i = 1; i < 9999; i += 1) {
    const code = `RET${String(base + i).padStart(6, "0")}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await ReturnRequest.findOne({ returnNumber: code }).select("_id").lean();
    if (!exists) return code;
  }
  return `RET${Date.now()}`;
};

function applyStatusGuards(existing, body) {
  const checks = [];
  if (body.order_status !== undefined && body.order_status !== existing.order_status) {
    checks.push(
      validateStatusTransition("order_status", existing.order_status, body.order_status)
    );
  }
  if (body.payment_status !== undefined && body.payment_status !== existing.payment_status) {
    checks.push(
      validateStatusTransition("payment_status", existing.payment_status, body.payment_status)
    );
  }
  if (body.fulfillment_status !== undefined && body.fulfillment_status !== existing.fulfillment_status) {
    checks.push(
      validateStatusTransition(
        "fulfillment_status",
        existing.fulfillment_status,
        body.fulfillment_status
      )
    );
  }
  const failed = checks.find((c) => !c.ok);
  return failed || { ok: true };
}

// GET /api/orders — list with grand totals for UI
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "customer_id",
        select: CUST_POP,
        populate: { path: "account_id", select: "email" },
      })
      .sort({ placed_at: -1 });

    const orderIds = orders.map((o) => o._id);
    const totals = await OrderTotal.find({ order_id: { $in: orderIds } });
    const totalsMap = {};
    totals.forEach((t) => {
      totalsMap[t.order_id.toString()] = t;
    });

    const data = orders.map((o) => {
      const obj = o.toObject();
      const t = totalsMap[o._id.toString()];
      obj.subtotal_amount = t?.subtotal_amount ?? 0;
      obj.shipping_fee_amount = t?.shipping_fee_amount ?? 0;
      obj.grand_total_amount = t?.grand_total_amount ?? 0;
      obj.item_discount_amount = t?.item_discount_amount ?? 0;
      obj.order_discount_amount = t?.order_discount_amount ?? 0;
      obj.tax_amount = t?.tax_amount ?? 0;
      return obj;
    });

    res.status(200).json({
      success: true,
      message: "Get all orders successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id — full detail: items, addresses, totals, status history
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(id)
      .populate("customer_id", CUST_POP_SHORT)
      .populate("checkout_session_id");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const [items, addresses, totals, status_history] = await Promise.all([
      OrderItem.find({ order_id: id })
        .populate("variant_id", "sku variantName")
        .populate("product_id", "productName productCode")
        .sort({ created_at: -1 }),
      OrderAddress.find({ order_id: id }).sort({ created_at: -1 }),
      OrderTotal.find({ order_id: id }),
      OrderStatusHistory.find({ order_id: id })
        .populate("changed_by_account_id", "email")
        .sort({ changed_at: -1 }),
    ]);

    const payload = order.toObject();
    payload.items = items;
    payload.order_addresses = addresses;
    payload.order_totals = totals;
    payload.order_total = totals[0] || null;
    payload.status_history = status_history;

    res.status(200).json({ success: true, message: "Get order successfully", data: payload });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/customer/:customer_id
const getOrdersByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;
    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }
    const orders = await Order.find({ customer_id }).sort({ placed_at: -1 });
    res.status(200).json({
      success: true,
      message: "Get orders by customer successfully",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/me/:id
const getMyOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    const customer = await resolveAuthCustomer(req);
    if (!customer) {
      return res.status(403).json({ success: false, message: "Authenticated account required" });
    }

    const order = await Order.findOne({ _id: id, customer_id: customer._id })
      .populate("customer_id", CUST_POP_SHORT)
      .populate("checkout_session_id");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const [items, addresses, totals, status_history] = await Promise.all([
      OrderItem.find({ order_id: id })
        .populate("variant_id", "sku variantName")
        .populate("product_id", "productName productCode")
        .sort({ created_at: -1 }),
      OrderAddress.find({ order_id: id }).sort({ created_at: -1 }),
      OrderTotal.find({ order_id: id }),
      OrderStatusHistory.find({ order_id: id })
        .populate("changed_by_account_id", "email")
        .sort({ changed_at: -1 }),
    ]);

    const payload = order.toObject();
    payload.items = items;
    payload.order_addresses = addresses;
    payload.order_totals = totals;
    payload.order_total = totals[0] || null;
    payload.status_history = status_history;

    return res.status(200).json({ success: true, message: "Get my order successfully", data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/me
const getMyOrders = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) {
      return res.status(403).json({ success: false, message: "Authenticated account required" });
    }

    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit || 10)));
    const skip = (page - 1) * limit;
    const status = String(req.query?.status || "").trim().toLowerCase();

    const filter = { customer_id: customer._id };
    if (status) filter.order_status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ placed_at: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    const orderIds = orders.map((o) => o._id);
    const [totals, shipments, itemAgg, orderItems] = await Promise.all([
      OrderTotal.find({ order_id: { $in: orderIds } }).lean(),
      Shipment.find({ order_id: { $in: orderIds } }).sort({ createdAt: -1 }).lean(),
      OrderItem.aggregate([
        { $match: { order_id: { $in: orderIds } } },
        {
          $group: {
            _id: "$order_id",
            itemCount: { $sum: 1 },
            totalQuantity: { $sum: "$quantity" },
            firstItemName: { $first: "$product_name_snapshot" },
            firstItemVariant: { $first: "$variant_name_snapshot" },
          },
        },
      ]),
      OrderItem.find({ order_id: { $in: orderIds } })
        .select("order_id product_name_snapshot variant_name_snapshot quantity")
        .sort({ created_at: -1 })
        .lean(),
    ]);

    const totalMap = new Map(totals.map((t) => [String(t.order_id), t]));
    const shipmentMap = new Map(shipments.map((s) => [String(s.order_id), s]));
    const itemMap = new Map(itemAgg.map((a) => [String(a._id), a]));
    const previewMap = new Map();
    for (const it of orderItems) {
      const key = String(it.order_id);
      if (!previewMap.has(key)) previewMap.set(key, []);
      const bucket = previewMap.get(key);
      if (bucket.length < 3) {
        bucket.push({
          product_name: it.product_name_snapshot || "",
          variant_name: it.variant_name_snapshot || "",
          quantity: Number(it.quantity || 0),
        });
      }
    }

    const data = orders.map((o) => {
      const t = totalMap.get(String(o._id));
      const s = shipmentMap.get(String(o._id));
      const i = itemMap.get(String(o._id));
      return {
        _id: String(o._id),
        order_number: o.order_number,
        order_status: o.order_status,
        payment_status: o.payment_status,
        fulfillment_status: o.fulfillment_status,
        placed_at: o.placed_at,
        grand_total_amount: Number(t?.grand_total_amount || 0),
        subtotal_amount: Number(t?.subtotal_amount || 0),
        shipping_fee_amount: Number(t?.shipping_fee_amount || 0),
        item_count: Number(i?.itemCount || 0),
        total_quantity: Number(i?.totalQuantity || 0),
        first_item_name: i?.firstItemName || "",
        first_item_variant: i?.firstItemVariant || "",
        item_previews: previewMap.get(String(o._id)) || [],
        shipment_status: s?.shipmentStatus || null,
        tracking_number: s?.trackingNumber || null,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Get my orders successfully",
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/reorder
const reorderMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required" });

    const order = await Order.findOne({ _id: id, customer_id: customer._id }).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const orderItems = await OrderItem.find({ order_id: id }).lean();
    if (!orderItems.length) {
      return res.status(400).json({ success: false, message: "Đơn hàng không có sản phẩm để mua lại." });
    }

    const cart = await ensureActiveCartForCustomer(customer._id);
    let added = 0;
    const skipped = [];

    for (const oi of orderItems) {
      const product = await Product.findById(oi.product_id).populate("brandId", "brandName");
      const variant = await ProductVariant.findById(oi.variant_id);
      if (!product || product.isActive === false || product.productStatus === "inactive") {
        skipped.push({ productId: String(oi.product_id || ""), reason: "PRODUCT_UNAVAILABLE" });
        continue;
      }
      if (!variant || variant.variantStatus === "inactive") {
        skipped.push({ variantId: String(oi.variant_id || ""), reason: "VARIANT_UNAVAILABLE" });
        continue;
      }
      const availableStock = Math.max(0, Number(product.stock || 0));
      if (availableStock <= 0) {
        skipped.push({ productId: String(oi.product_id || ""), reason: "OUT_OF_STOCK" });
        continue;
      }

      const desiredQty = Math.max(1, Number(oi.quantity || 1));
      const lineKey = `${String(product._id)}::${String(variant._id)}`;
      const existing = await CartItem.findOne({
        cart_id: cart._id,
        $or: [{ line_key: lineKey }, { product_id: product._id, variant_id: variant._id }],
      });
      const unitPrice = formatMoneyInt(product.price || 0);
      const finalQty = existing
        ? Math.min(availableStock, Math.max(1, Number(existing.quantity || 1) + desiredQty))
        : Math.min(availableStock, desiredQty);

      if (existing) {
        existing.quantity = finalQty;
        existing.unit_price_amount = unitPrice;
        existing.final_unit_price_amount = unitPrice;
        existing.line_total_amount = unitPrice * finalQty;
        existing.product_name_snapshot = product.productName || oi.product_name_snapshot || "Product";
        existing.variant_name_snapshot = variant.variantName || oi.variant_name_snapshot || "Default";
        existing.brand_name_snapshot = product.brandId?.brandName || "";
        existing.image_url_snapshot = product.imageUrl || "";
        existing.stock_status = availableStock > 0 ? "in_stock" : "out_of_stock";
        existing.selected = true;
        existing.line_key = lineKey;
        await existing.save();
      } else {
        await CartItem.create({
          line_key: lineKey,
          product_id: product._id,
          cart_id: cart._id,
          variant_id: variant._id,
          sku_snapshot: variant.sku || oi.sku_snapshot || String(variant._id),
          product_name_snapshot: product.productName || oi.product_name_snapshot || "Product",
          variant_name_snapshot: variant.variantName || oi.variant_name_snapshot || "Default",
          brand_name_snapshot: product.brandId?.brandName || "",
          image_url_snapshot: product.imageUrl || "",
          compare_at_price_amount: 0,
          stock_status: availableStock > 0 ? "in_stock" : "out_of_stock",
          quantity: finalQty,
          selected: true,
          unit_price_amount: unitPrice,
          discount_amount: 0,
          final_unit_price_amount: unitPrice,
          line_total_amount: unitPrice * finalQty,
        });
      }
      added += 1;
    }

    await recalcCartTotals(cart._id);
    return res.status(200).json({
      success: true,
      message: added > 0 ? "Reorder completed" : "No eligible items for reorder",
      data: { added, skipped, cartId: String(cart._id) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id/cancel
const cancelMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = String(req.body?.reason || "customer_cancel").trim();
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required" });

    const order = await Order.findOne({ _id: id, customer_id: customer._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.order_status === "cancelled") {
      return res.status(400).json({ success: false, message: "Đơn hàng đã được hủy trước đó." });
    }
    if (["completed"].includes(String(order.order_status || "").toLowerCase())) {
      return res.status(400).json({ success: false, message: "Không thể hủy đơn hàng đã hoàn tất." });
    }

    const oldOrderStatus = order.order_status;
    const oldPaymentStatus = order.payment_status;
    const oldFulfillmentStatus = order.fulfillment_status;

    order.order_status = "cancelled";
    order.cancelled_at = new Date();
    order.cancellation_reason = reason;
    await order.save();

    await OrderStatusHistory.create({
      order_id: order._id,
      old_order_status: oldOrderStatus,
      new_order_status: "cancelled",
      old_payment_status: oldPaymentStatus,
      new_payment_status: oldPaymentStatus,
      old_fulfillment_status: oldFulfillmentStatus,
      new_fulfillment_status: oldFulfillmentStatus,
      changed_by_account_id: req.user?.account_id || req.user?.accountId || null,
      change_reason: reason || "customer_cancel",
      changed_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: { _id: String(order._id), order_status: order.order_status, cancelled_at: order.cancelled_at },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/:id/return
const requestReturnMyOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const customer = await resolveAuthCustomer(req);
    if (!customer) return res.status(403).json({ success: false, message: "Authenticated account required" });
    const order = await Order.findOne({ _id: id, customer_id: customer._id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const status = String(order.order_status || "").toLowerCase();
    const ff = String(order.fulfillment_status || "").toLowerCase();
    if (!(status === "completed" || ff === "fulfilled")) {
      return res.status(400).json({ success: false, message: "Đơn hàng chưa đủ điều kiện để yêu cầu trả hàng." });
    }

    const existing = await ReturnRequest.findOne({ order_id: order._id }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "Yêu cầu trả hàng đã tồn tại cho đơn này." });
    }

    const ret = await ReturnRequest.create({
      order_id: order._id,
      returnNumber: await generateReturnNumber(),
      returnReason: String(req.body?.reason || "customer_request").trim(),
      returnStatus: "requested",
      requested_by_customer_id: customer._id,
      note: String(req.body?.note || "").trim(),
      requestedAt: new Date(),
    });

    order.fulfillment_status = "return_requested";
    await order.save();

    await OrderStatusHistory.create({
      order_id: order._id,
      old_order_status: order.order_status,
      new_order_status: order.order_status,
      old_payment_status: order.payment_status,
      new_payment_status: order.payment_status,
      old_fulfillment_status: ff || "fulfilled",
      new_fulfillment_status: "returned",
      changed_by_account_id: req.user?.account_id || req.user?.accountId || null,
      change_reason: "return_requested",
      changed_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Return requested successfully",
      data: {
        returnId: String(ret._id),
        returnNumber: ret.returnNumber,
        returnStatus: ret.returnStatus,
        requestedAt: ret.requestedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/me/summary
const getMyOrderSummary = async (req, res) => {
  try {
    const customer = await resolveAuthCustomer(req);
    if (!customer) {
      return res.status(403).json({ success: false, message: "Authenticated account required" });
    }
    const [totalOrders, pendingOrders] = await Promise.all([
      Order.countDocuments({ customer_id: customer._id }),
      Order.countDocuments({ customer_id: customer._id, order_status: { $in: ["pending", "confirmed", "processing"] } }),
    ]);
    return res.status(200).json({
      success: true,
      message: "Get my order summary successfully",
      data: {
        total_orders: totalOrders,
        pending_orders: pendingOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/me/:id/tracking
const getMyOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    const customer = await resolveAuthCustomer(req);
    if (!customer) {
      return res.status(403).json({ success: false, message: "Authenticated account required" });
    }

    const order = await Order.findOne({ _id: id, customer_id: customer._id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const [shipment, shipmentEvents, statusHistory, paymentIntent] = await Promise.all([
      Shipment.findOne({ order_id: id }).sort({ createdAt: -1 }).lean(),
      ShipmentEvent.find({
        shipmentId: {
          $in: (
            await Shipment.find({ order_id: id }).select("_id").lean()
          ).map((x) => x._id),
        },
      })
        .sort({ eventTime: -1 })
        .lean(),
      OrderStatusHistory.find({ order_id: id }).sort({ changed_at: -1 }).lean(),
      PaymentIntent.findOne({ order_id: id }).sort({ createdAt: -1 }).lean(),
    ]);

    const paymentMethod = paymentIntent?.payment_method_id
      ? await PaymentMethod.findById(paymentIntent.payment_method_id).lean()
      : null;

    const eventsFromShipment = shipmentEvents.map((e) => ({
      code: e.eventCode || "",
      status: e.eventStatus || "",
      description: e.eventDescription || "",
      timestamp: e.eventTime || e.createdAt,
      location: e.locationText || "",
      source: "shipment_event",
    }));

    const eventsFromStatus = statusHistory.map((h) => ({
      code: h.new_order_status || "order_update",
      status: h.new_order_status || "",
      description: h.change_reason || "Order status updated",
      timestamp: h.changed_at,
      location: "",
      source: "order_status",
    }));

    const events = [...eventsFromShipment, ...eventsFromStatus].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return res.status(200).json({
      success: true,
      message: "Get my order tracking successfully",
      data: {
        orderId: String(order._id),
        orderNumber: order.order_number,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        fulfillmentStatus: order.fulfillment_status,
        paymentMethod: paymentMethod?.payment_method_name || null,
        shipment: shipment
          ? {
              shipmentId: String(shipment._id),
              shipmentNumber: shipment.shipmentNumber,
              shipmentStatus: shipment.shipmentStatus,
              carrierCode: shipment.carrierCode || null,
              serviceName: shipment.serviceName || null,
              trackingNumber: shipment.trackingNumber || null,
              shippedAt: shipment.shippedAt || null,
              deliveredAt: shipment.deliveredAt || null,
            }
          : null,
        latestUpdateAt: events[0]?.timestamp || order.updated_at || order.placed_at,
        events,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders/guest/lookup
const lookupGuestOrder = async (req, res) => {
  try {
    const orderNumber = String(req.body?.orderNumber || "").trim().toUpperCase();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!orderNumber || (!phone && !email)) {
      return res.status(400).json({ success: false, message: "orderNumber and phone or email are required" });
    }

    const order = await Order.findOne({
      owner_type: "guest",
      order_number: orderNumber,
      ...(phone ? { guest_phone: phone } : {}),
      ...(email ? { guest_email: email } : {}),
    }).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return res.status(200).json({
      success: true,
      message: "Guest order found",
      data: {
        orderId: String(order._id),
        orderNumber: order.order_number,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        placedAt: order.placed_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/guest/:id/summary
const getGuestOrderSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const guestSessionId = String(req.headers["x-guest-session-id"] || "").trim();
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await Order.findById(id).lean();
    if (!order || order.owner_type !== "guest") {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (guestSessionId && String(order.guest_session_id || "") !== guestSessionId) {
      return res.status(403).json({ success: false, message: "Guest session mismatch" });
    }
    const [items, addresses, totals] = await Promise.all([
      OrderItem.find({ order_id: id }).lean(),
      OrderAddress.find({ order_id: id }).lean(),
      OrderTotal.findOne({ order_id: id }).lean(),
    ]);
    return res.status(200).json({
      success: true,
      message: "Guest order summary loaded",
      data: {
        ...order,
        items,
        order_addresses: addresses,
        order_total: totals || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/guest/:id/tracking
const getGuestOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const guestSessionId = String(req.headers["x-guest-session-id"] || "").trim();
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await Order.findById(id).lean();
    if (!order || order.owner_type !== "guest") return res.status(404).json({ success: false, message: "Order not found" });
    if (guestSessionId && String(order.guest_session_id || "") !== guestSessionId) {
      return res.status(403).json({ success: false, message: "Guest session mismatch" });
    }
    const shipments = await Shipment.find({ order_id: id }).select("_id").lean();
    const shipmentIds = shipments.map((x) => x._id);
    const events = await ShipmentEvent.find({ shipmentId: { $in: shipmentIds } }).sort({ eventTime: -1 }).lean();
    return res.status(200).json({
      success: true,
      message: "Guest order tracking loaded",
      data: {
        orderId: String(order._id),
        orderNumber: order.order_number,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        fulfillmentStatus: order.fulfillment_status,
        paymentMethod: null,
        shipment: null,
        latestUpdateAt: order.updated_at || order.placed_at,
        events: events.map((e) => ({
          code: e.eventCode || "",
          status: e.eventStatus || "",
          description: e.eventDescription || "",
          timestamp: e.eventTime || e.createdAt,
          location: e.locationText || "",
          source: "shipment_event",
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);
    const body = normalizeOrderBody(req.body);
    const order_number = body.order_number ?? req.body.orderNumber;

    if (!order_number || !customer_id) {
      return res.status(400).json({
        success: false,
        message: "order_number and customer_id are required",
      });
    }
    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer_id" });
    }
    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const payload = { ...body, order_number, customer_id };
    const order = await Order.create(payload);
    res.status(201).json({ success: true, message: "Order created successfully", data: order });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Order number already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });

    const existing = await Order.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Order not found" });

    const body = normalizeOrderBody(req.body);
    const guard = applyStatusGuards(existing, body);
    if (!guard.ok) {
      return res.status(400).json({ success: false, message: guard.message });
    }

    const statusChanged =
      (body.order_status !== undefined && body.order_status !== existing.order_status) ||
      (body.payment_status !== undefined && body.payment_status !== existing.payment_status) ||
      (body.fulfillment_status !== undefined && body.fulfillment_status !== existing.fulfillment_status);

    const order = await Order.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (statusChanged) {
      await OrderStatusHistory.create({
        order_id: id,
        old_order_status: existing.order_status,
        new_order_status: body.order_status ?? existing.order_status,
        old_payment_status: existing.payment_status,
        new_payment_status: body.payment_status ?? existing.payment_status,
        old_fulfillment_status: existing.fulfillment_status,
        new_fulfillment_status: body.fulfillment_status ?? existing.fulfillment_status,
        changed_by_account_id: body.changed_by_account_id ?? req.body.changedByAccountId ?? null,
        change_reason: body.change_reason ?? req.body.changeReason ?? "",
        changed_at: new Date(),
      });
    }

    res.status(200).json({ success: true, message: "Order updated successfully", data: order });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Order number already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await Order.findByIdAndDelete(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, message: "Order deleted successfully", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/orders/:id
const patchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const existing = await Order.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Order not found" });

    const raw = normalizeOrderBody(req.body);
    const allowed = ["order_status", "payment_status", "fulfillment_status", "customer_note"];
    const updates = {};
    for (const key of allowed) {
      if (raw[key] !== undefined) updates[key] = raw[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const guard = applyStatusGuards(existing, updates);
    if (!guard.ok) {
      return res.status(400).json({ success: false, message: guard.message });
    }

    const order = await Order.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate(
      "customer_id",
      CUST_POP_SHORT
    );

    const hist =
      (updates.order_status !== undefined && updates.order_status !== existing.order_status) ||
      (updates.payment_status !== undefined && updates.payment_status !== existing.payment_status) ||
      (updates.fulfillment_status !== undefined && updates.fulfillment_status !== existing.fulfillment_status);

    if (hist) {
      await OrderStatusHistory.create({
        order_id: id,
        old_order_status: existing.order_status,
        new_order_status: updates.order_status ?? existing.order_status,
        old_payment_status: existing.payment_status,
        new_payment_status: updates.payment_status ?? existing.payment_status,
        old_fulfillment_status: existing.fulfillment_status,
        new_fulfillment_status: updates.fulfillment_status ?? existing.fulfillment_status,
        changed_by_account_id: raw.changed_by_account_id ?? req.body.changedByAccountId ?? null,
        change_reason: raw.change_reason ?? req.body.changeReason ?? "patch",
        changed_at: new Date(),
      });
    }

    res.status(200).json({ success: true, message: "Order patched successfully", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getOrdersByCustomerId,
  getMyOrders,
  getMyOrderSummary,
  getMyOrderById,
  getMyOrderTracking,
  reorderMyOrder,
  cancelMyOrder,
  requestReturnMyOrder,
  lookupGuestOrder,
  getGuestOrderSummary,
  getGuestOrderTracking,
  createOrder,
  updateOrder,
  patchOrder,
  deleteOrder,
};
