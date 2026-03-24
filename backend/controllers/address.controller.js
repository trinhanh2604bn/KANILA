const Address = require("../models/address.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerIdParam } = require("../utils/pickCustomerRef");

const CUST_SELECT = "customer_code full_name";

function normalizeAddressPayload(body, partial = false) {
  const p = (snake, camel, def) => {
    if (body[snake] !== undefined) return body[snake];
    if (body[camel] !== undefined) return body[camel];
    return def;
  };
  const undef = partial ? undefined : undefined;
  const base = {
    address_label: p("address_label", "addressLabel", ""),
    recipient_name: p("recipient_name", "recipientName", undef),
    phone: p("phone", "phone", undef),
    address_line_1: p("address_line_1", "addressLine1", undef),
    address_line_2: p("address_line_2", "addressLine2", ""),
    ward: p("ward", "ward", ""),
    district: p("district", "district", ""),
    city: p("city", "city", undef),
    country_code: p("country_code", "countryCode", "VN"),
    postal_code: p("postal_code", "postalCode", ""),
    is_default_shipping: p("is_default_shipping", "isDefaultShipping", false),
    is_default_billing: p("is_default_billing", "isDefaultBilling", false),
  };
  if (body.customer_id !== undefined || body.customerId !== undefined) {
    base.customer_id = body.customer_id ?? body.customerId;
  }
  if (partial) {
    const out = {};
    for (const [k, v] of Object.entries(base)) {
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return base;
}

// GET /api/addresses
const getAllAddresses = async (req, res) => {
  try {
    const addresses = await Address.find()
      .populate("customer_id", CUST_SELECT)
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all addresses successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/addresses/:id
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const address = await Address.findById(id).populate("customer_id", CUST_SELECT);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get address successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/addresses/customer/:customer_id
const getAddressesByCustomerId = async (req, res) => {
  try {
    const customer_id = pickCustomerIdParam(req);

    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const addresses = await Address.find({ customer_id }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get addresses by customer successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/addresses/me
const getMyAddresses = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }
    const customer = await Customer.findOne({ account_id: accountId }).select("_id");
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const addresses = await Address.find({ customer_id: customer._id }).sort({ is_default_shipping: -1, created_at: -1 });
    const defaultAddress =
      addresses.find((x) => x.is_default_shipping === true) ||
      addresses.find((x) => x.is_default_billing === true) ||
      addresses[0] ||
      null;

    return res.status(200).json({
      success: true,
      message: "Get my addresses successfully",
      data: {
        addresses,
        defaultAddress,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/addresses
const createAddress = async (req, res) => {
  try {
    const payload = normalizeAddressPayload(req.body);
    const {
      customer_id,
      recipient_name,
      phone,
      address_line_1,
      city,
      is_default_shipping,
      is_default_billing,
    } = payload;

    if (!customer_id || !recipient_name || !phone || !address_line_1 || !city) {
      return res.status(400).json({
        success: false,
        message:
          "customer_id, recipient_name, phone, address_line_1, and city are required",
      });
    }

    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer_id" });
    }

    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (is_default_shipping === true) {
      await Address.updateMany(
        { customer_id, is_default_shipping: true },
        { is_default_shipping: false }
      );
    }

    if (is_default_billing === true) {
      await Address.updateMany(
        { customer_id, is_default_billing: true },
        { is_default_billing: false }
      );
    }

    const address = await Address.create(payload);

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/addresses/:id
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const is_default_shipping = body.is_default_shipping ?? body.isDefaultShipping;
    const is_default_billing = body.is_default_billing ?? body.isDefaultBilling;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const existingAddress = await Address.findById(id);
    if (!existingAddress) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const customer_id = existingAddress.customer_id;

    if (is_default_shipping === true) {
      await Address.updateMany(
        { customer_id, _id: { $ne: id }, is_default_shipping: true },
        { is_default_shipping: false }
      );
    }

    if (is_default_billing === true) {
      await Address.updateMany(
        { customer_id, _id: { $ne: id }, is_default_billing: true },
        { is_default_billing: false }
      );
    }

    const updates = normalizeAddressPayload(body, true);
    delete updates.customer_id;

    const address = await Address.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/addresses/:id
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const address = await Address.findByIdAndDelete(id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAddresses,
  getAddressById,
  getAddressesByCustomerId,
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
