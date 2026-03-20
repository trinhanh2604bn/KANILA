const LoyaltyAccount = require("../models/loyaltyAccount.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllLoyaltyAccounts = async (req, res) => {
  try {
    const accounts = await LoyaltyAccount.find().populate("customerId", "customerCode fullName").populate("tierId", "tierCode tierName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all loyalty accounts successfully", count: accounts.length, data: accounts });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLoyaltyAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const account = await LoyaltyAccount.findById(id).populate("customerId", "customerCode fullName").populate("tierId", "tierCode tierName");
    if (!account) return res.status(404).json({ success: false, message: "Loyalty account not found" });
    res.status(200).json({ success: true, message: "Get loyalty account successfully", data: account });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getAccountByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const accounts = await LoyaltyAccount.find({ customerId }).populate("tierId", "tierCode tierName");
    res.status(200).json({ success: true, message: "Get loyalty accounts by customer successfully", count: accounts.length, data: accounts });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createLoyaltyAccount = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ success: false, message: "customerId is required" });
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customerId" });
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });
    const account = await LoyaltyAccount.create(req.body);
    res.status(201).json({ success: true, message: "Loyalty account created successfully", data: account });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateLoyaltyAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const account = await LoyaltyAccount.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!account) return res.status(404).json({ success: false, message: "Loyalty account not found" });
    res.status(200).json({ success: true, message: "Loyalty account updated successfully", data: account });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteLoyaltyAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const account = await LoyaltyAccount.findByIdAndDelete(id);
    if (!account) return res.status(404).json({ success: false, message: "Loyalty account not found" });
    res.status(200).json({ success: true, message: "Loyalty account deleted successfully", data: account });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllLoyaltyAccounts, getLoyaltyAccountById, getAccountByCustomerId, createLoyaltyAccount, updateLoyaltyAccount, deleteLoyaltyAccount };
