const LoyaltyPointLedger = require("../models/loyaltyPointLedger.model");
const LoyaltyAccount = require("../models/loyaltyAccount.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllLoyaltyPointLedger = async (req, res) => {
  try {
    const entries = await LoyaltyPointLedger.find().populate("loyaltyAccountId", "pointsBalance").populate("customerId", "customerCode fullName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all ledger entries successfully", count: entries.length, data: entries });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLoyaltyPointLedgerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const entry = await LoyaltyPointLedger.findById(id).populate("loyaltyAccountId", "pointsBalance").populate("customerId", "customerCode fullName");
    if (!entry) return res.status(404).json({ success: false, message: "Ledger entry not found" });
    res.status(200).json({ success: true, message: "Get ledger entry successfully", data: entry });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLedgerByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const entries = await LoyaltyPointLedger.find({ customerId }).sort({ createdAt: -1 });
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
    const { loyaltyAccountId, customerId, transactionType, pointsDelta } = req.body;
    if (!loyaltyAccountId || !customerId || !transactionType || pointsDelta === undefined) {
      return res.status(400).json({ success: false, message: "loyaltyAccountId, customerId, transactionType, and pointsDelta are required" });
    }
    if (!validateObjectId(loyaltyAccountId)) return res.status(400).json({ success: false, message: "Invalid loyaltyAccountId" });

    const account = await LoyaltyAccount.findById(loyaltyAccountId);
    if (!account) return res.status(404).json({ success: false, message: "Loyalty account not found" });

    // Record before/after
    req.body.pointsBefore = account.pointsBalance;
    req.body.pointsAfter = account.pointsBalance + pointsDelta;

    const entry = await LoyaltyPointLedger.create(req.body);

    // Update loyalty account balance
    const updateFields = { pointsBalance: req.body.pointsAfter };
    if (pointsDelta > 0) updateFields.$inc = { lifetimePointsEarned: pointsDelta };
    else if (pointsDelta < 0) updateFields.$inc = { lifetimePointsRedeemed: Math.abs(pointsDelta) };

    if (updateFields.$inc) {
      await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { pointsBalance: req.body.pointsAfter, ...updateFields.$inc ? {} : {} });
      // Simple approach: update individually
      await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { pointsBalance: req.body.pointsAfter });
      if (pointsDelta > 0) await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { $inc: { lifetimePointsEarned: pointsDelta } });
      else await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { $inc: { lifetimePointsRedeemed: Math.abs(pointsDelta) } });
    } else {
      await LoyaltyAccount.findByIdAndUpdate(loyaltyAccountId, { pointsBalance: req.body.pointsAfter });
    }

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
