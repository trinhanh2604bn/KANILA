const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderAddress = require("../models/orderAddress.model");
const OrderTotal = require("../models/orderTotal.model");
const Customer = require("../models/customer.model");
const OrderStatusHistory = require("../models/orderStatusHistory.model");
const Account = require("../models/account.model");
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
  getMyOrderById,
  createOrder,
  updateOrder,
  patchOrder,
  deleteOrder,
};
