const CustomerConsent = require("../models/customerConsent.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const getAll = async (req, res) => {
  try {
    const rows = await CustomerConsent.find().populate("customer_id", "customer_code full_name").sort({ created_at: -1 });
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const row = await CustomerConsent.findById(id).populate("customer_id", "customer_code full_name");
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
    const rows = await CustomerConsent.find({ customer_id }).sort({ created_at: -1 });
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const createRow = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);
    if (!customer_id) return res.status(400).json({ success: false, message: "customer_id is required" });
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer_id" });
    const exists = await Customer.findById(customer_id);
    if (!exists) return res.status(404).json({ success: false, message: "Customer not found" });
    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    if (!payload.created_at) payload.created_at = new Date();
    const row = await CustomerConsent.create(payload);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const updateRow = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const body = { ...req.body };
    delete body.customer_id;
    delete body.customerId;
    const row = await CustomerConsent.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

const deleteRow = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const row = await CustomerConsent.findByIdAndDelete(id);
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = { getAll, getById, getByCustomer, createRow, updateRow, deleteRow };
