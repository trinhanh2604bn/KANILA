const Customer = require("../models/customer.model");
const Account = require("../models/account.model");
const validateObjectId = require("../utils/validateObjectId");
const { isCustomerListable } = require("../utils/customerListable");

// GET /api/customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .populate("accountId", "email phone accountType accountStatus")
      .sort({ createdAt: -1 });

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
      "accountId",
      "email phone accountType accountStatus"
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

// GET /api/customers/account/:accountId
const getCustomerByAccountId = async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!validateObjectId(accountId)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const customer = await Customer.findOne({ accountId }).populate(
      "accountId",
      "email phone accountType accountStatus"
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

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    // Prevent changing accountId and customerCode through update
    delete req.body.accountId;
    delete req.body.customerCode;

    const customer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("accountId", "email phone accountType accountStatus");

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
    const allowed = ["fullName", "phone", "gender", "dateOfBirth", "avatarUrl"];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    const customer = await Customer.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("accountId", "email accountType accountStatus");
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.status(200).json({ success: true, message: "Customer patched successfully", data: customer });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerByAccountId,
  updateCustomer,
  patchCustomer,
  deleteCustomer,
};
