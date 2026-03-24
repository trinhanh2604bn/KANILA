const LoyaltyAccount = require("../models/loyaltyAccount.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name";

const getAllLoyaltyAccounts = async (req, res) => {
  try {
    const accounts = await LoyaltyAccount.find().populate("customer_id", CUST).populate("tierId", "tierCode tierName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all loyalty accounts successfully", count: accounts.length, data: accounts });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLoyaltyAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const account = await LoyaltyAccount.findById(id).populate("customer_id", CUST).populate("tierId", "tierCode tierName");
    if (!account) return res.status(404).json({ success: false, message: "Loyalty account not found" });
    res.status(200).json({ success: true, message: "Get loyalty account successfully", data: account });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getAccountByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const accounts = await LoyaltyAccount.find({ customer_id }).populate("tierId", "tierCode tierName");
    res.status(200).json({ success: true, message: "Get loyalty accounts by customer successfully", count: accounts.length, data: accounts });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// GET /api/loyalty/me
const getMyLoyaltyAccount = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }
    const customer = await Customer.findOne({ account_id: accountId }).select("_id");
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const loyalty = await LoyaltyAccount.findOne({ customer_id: customer._id })
      .populate("tierId", "tierCode tierName")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Get my loyalty account successfully",
      data: {
        points_balance: Number(loyalty?.pointsBalance || 0),
        tier_name: loyalty?.tierId?.tierName || "Member",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createLoyaltyAccount = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);
    if (!customer_id) return res.status(400).json({ success: false, message: "customer_id is required" });
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer_id" });
    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });
    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    const account = await LoyaltyAccount.create(payload);
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

module.exports = { getAllLoyaltyAccounts, getLoyaltyAccountById, getAccountByCustomerId, getMyLoyaltyAccount, createLoyaltyAccount, updateLoyaltyAccount, deleteLoyaltyAccount };
