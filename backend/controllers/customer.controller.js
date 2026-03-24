const Customer = require("../models/customer.model");
const Account = require("../models/account.model");
const validateObjectId = require("../utils/validateObjectId");
const { isCustomerListable } = require("../utils/customerListable");
const { normalizeCustomerWrite } = require("../utils/customerProfileBody");

const ACCOUNT_POPULATE_SELECT = "email phone account_type account_status";

// GET /api/customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate("account_id", ACCOUNT_POPULATE_SELECT)
      .sort({ created_at: -1 });

    const data = customers.filter((c) => isCustomerListable(c));

    res.status(200).json({
      success: true,
      message: "Get all customers successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const customer = await Customer.findById(id).populate(
      "account_id",
      ACCOUNT_POPULATE_SELECT
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get customer successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/customers/account/:account_id
const getCustomerByAccountId = async (req, res) => {
  try {
    const { account_id } = req.params;

    if (!validateObjectId(account_id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const customer = await Customer.findOne({ account_id }).populate(
      "account_id",
      ACCOUNT_POPULATE_SELECT
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found for this account" });
    }

    res.status(200).json({
      success: true,
      message: "Get customer by account successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/customer/me
const getMyCustomerProfile = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }

    const customer = await Customer.findOne({ account_id: accountId }).populate("account_id", ACCOUNT_POPULATE_SELECT);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer profile not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Get my customer profile successfully",
      data: {
        customerId: String(customer._id),
        full_name: customer.full_name || "",
        email: customer.account_id?.email || "",
        phone: customer.account_id?.phone || "",
        gender: customer.gender || "",
        birthday: customer.date_of_birth || null,
        avatar_url: customer.avatar_url || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const body = normalizeCustomerWrite(req.body);
    delete body.customer_code;
    delete req.body.customerCode;

    const customer = await Customer.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("account_id", ACCOUNT_POPULATE_SELECT);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/customers/:id
const patchCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const normalized = normalizeCustomerWrite(req.body);
    const allowedKeys = ["full_name", "first_name", "last_name", "gender", "date_of_birth", "avatar_url", "customer_status"];
    const updates = {};
    for (const key of allowedKeys) {
      if (normalized[key] !== undefined) updates[key] = normalized[key];
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    const customer = await Customer.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("account_id", "email account_type account_status");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.status(200).json({ success: true, message: "Customer patched successfully", data: customer });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerByAccountId,
  getMyCustomerProfile,
  updateCustomer,
  patchCustomer,
  deleteCustomer,
};
