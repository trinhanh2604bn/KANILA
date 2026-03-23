const LoyaltyPointLedger = require("../models/loyaltyPointLedger.model");
const LoyaltyAccount = require("../models/loyaltyAccount.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name";

const getAllLoyaltyPointLedger = async (req, res) => {
  try {
    const entries = await LoyaltyPointLedger.find().populate("loyaltyAccountId", "pointsBalance").populate("customer_id", CUST).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all ledger entries successfully", count: entries.length, data: entries });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLoyaltyPointLedgerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const entry = await LoyaltyPointLedger.findById(id).populate("loyaltyAccountId", "pointsBalance").populate("customer_id", CUST);
    if (!entry) return res.status(404).json({ success: false, message: "Ledger entry not found" });
    res.status(200).json({ success: true, message: "Get ledger entry successfully", data: entry });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLedgerByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const entries = await LoyaltyPointLedger.find({ customer_id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get ledger by customer successfully", count: entries.length, data: entries });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLedgerByAccountId = async (req, res) => {
  try {
    const { loyaltyAccountId } = req.params;
    if (!validateObjectId(loyaltyAccountId)) return res.status(400).json({ success: false, message: "Invalid loyalty account ID" });
    const entries = await LoyaltyPointLedger.find({ loyaltyAccountId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get ledger by account successfully", count: entries.length, data: entries });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createLoyaltyPointLedger = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);
    const { loyaltyAccountId, transactionType, pointsDelta } = req.body;
    if (!loyaltyAccountId || !customer_id || !transactionType || pointsDelta === undefined) {
      return res.status(400).json({ success: false, message: "loyaltyAccountId, customer_id, transactionType, and pointsDelta are required" });
    }
    if (!validateObjectId(loyaltyAccountId)) return res.status(400).json({ success: false, message: "Invalid loyaltyAccountId" });

    const account = await LoyaltyAccount.findById(loyaltyAccountId);
    if (!account) return res.status(404).json({ success: false, message: "Loyalty account not found" });

    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    payload.pointsBefore = account.pointsBalance;
    payload.pointsAfter = account.pointsBalance + pointsDelta;

    const entry = await LoyaltyPointLedger.create(payload);

    await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { pointsBalance: payload.pointsAfter });
    if (pointsDelta > 0) await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { $inc: { lifetimePointsEarned: pointsDelta } });
    else await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { $inc: { lifetimePointsRedeemed: Math.abs(pointsDelta) } });

    res.status(201).json({ success: true, message: "Ledger entry created successfully", data: entry });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteLoyaltyPointLedger = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const entry = await LoyaltyPointLedger.findByIdAndDelete(id);
    if (!entry) return res.status(404).json({ success: false, message: "Ledger entry not found" });
    res.status(200).json({ success: true, message: "Ledger entry deleted successfully", data: entry });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllLoyaltyPointLedger, getLoyaltyPointLedgerById, getLedgerByCustomerId, getLedgerByAccountId, createLoyaltyPointLedger, deleteLoyaltyPointLedger };
