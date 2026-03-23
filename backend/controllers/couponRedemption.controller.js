const CouponRedemption = require("../models/couponRedemption.model");
const Coupon = require("../models/coupon.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name";

// GET /api/coupon-redemptions
const getAllCouponRedemptions = async (req, res) => {
  try {
    const redemptions = await CouponRedemption.find()
      .populate("couponId", "couponCode couponStatus")
      .populate("customer_id", CUST)
      .sort({ redeemedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all coupon redemptions successfully",
      count: redemptions.length,
      data: redemptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupon-redemptions/:id
const getCouponRedemptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid redemption ID" });
    }

    const redemption = await CouponRedemption.findById(id)
      .populate("couponId", "couponCode couponStatus")
      .populate("customer_id", CUST);

    if (!redemption) {
      return res.status(404).json({ success: false, message: "Coupon redemption not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get coupon redemption successfully",
      data: redemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupon-redemptions/coupon/:couponId
const getRedemptionsByCouponId = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!validateObjectId(couponId)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    }

    const redemptions = await CouponRedemption.find({ couponId })
      .populate("customer_id", CUST)
      .sort({ redeemedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get redemptions by coupon successfully",
      count: redemptions.length,
      data: redemptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupon-redemptions/customer/:customerId
const getRedemptionsByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;

    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const redemptions = await CouponRedemption.find({ customer_id })
      .populate("couponId", "couponCode couponStatus")
      .sort({ redeemedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get redemptions by customer successfully",
      count: redemptions.length,
      data: redemptions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupon-redemptions
const createCouponRedemption = async (req, res) => {
  try {
    const { couponId, discountAmount } = req.body;
    const customer_id = pickCustomerId(req.body);

    if (!couponId || !customer_id || discountAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "couponId, customer_id, and discountAmount are required",
      });
    }

    if (!validateObjectId(couponId)) {
      return res.status(400).json({ success: false, message: "Invalid couponId" });
    }
    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer_id" });
    }

    // Verify coupon exists
    const couponExists = await Coupon.findById(couponId);
    if (!couponExists) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // Verify customer exists
    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (discountAmount < 0) {
      return res.status(400).json({ success: false, message: "discountAmount must not be negative" });
    }

    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    const redemption = await CouponRedemption.create(payload);

    res.status(201).json({
      success: true,
      message: "Coupon redemption created successfully",
      data: redemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/coupon-redemptions/:id
const updateCouponRedemption = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid redemption ID" });
    }

    const redemption = await CouponRedemption.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!redemption) {
      return res.status(404).json({ success: false, message: "Coupon redemption not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupon redemption updated successfully",
      data: redemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/coupon-redemptions/:id
const deleteCouponRedemption = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid redemption ID" });
    }

    const redemption = await CouponRedemption.findByIdAndDelete(id);

    if (!redemption) {
      return res.status(404).json({ success: false, message: "Coupon redemption not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupon redemption deleted successfully",
      data: redemption,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCouponRedemptions,
  getCouponRedemptionById,
  getRedemptionsByCouponId,
  getRedemptionsByCustomerId,
  createCouponRedemption,
  updateCouponRedemption,
  deleteCouponRedemption,
};
