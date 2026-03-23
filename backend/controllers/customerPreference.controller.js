const CustomerPreference = require("../models/customerPreference.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const getAll = async (req, res) => {
  try {
    const rows = await CustomerPreference.find().populate("customer_id", "customer_code full_name").sort({ updated_at: -1 });
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const row = await CustomerPreference.findById(id).populate("customer_id", "customer_code full_name");
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getByCustomer = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer_id" });
    const rows = await CustomerPreference.find({ customer_id }).sort({ updated_at: -1 });
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const upsert = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);
    const { preference_key, preference_value } = req.body;
    if (!customer_id || !preference_key) {
      return res.status(400).json({ success: false, message: "customer_id and preference_key are required" });
    }
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer_id" });
    const exists = await Customer.findById(customer_id);
    if (!exists) return res.status(404).json({ success: false, message: "Customer not found" });

    const row = await CustomerPreference.findOneAndUpdate(
      { customer_id, preference_key },
      { preference_value: preference_value ?? "", updated_at: new Date() },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const deleteRow = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const row = await CustomerPreference.findByIdAndDelete(id);
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getAll, getById, getByCustomer, upsert, deleteRow };
