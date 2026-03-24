const Coupon = require("../models/coupon.model");
const Promotion = require("../models/promotion.model");
const CouponRedemption = require("../models/couponRedemption.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/coupons
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate("promotionId", "promotionCode promotionName discountType discountValue")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all coupons successfully",
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/:id
const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id).populate(
      "promotionId",
      "promotionCode promotionName discountType discountValue"
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get coupon successfully",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/code/:couponCode
const getCouponByCode = async (req, res) => {
  try {
    const { couponCode } = req.params;

    const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() }).populate(
      "promotionId",
      "promotionCode promotionName discountType discountValue promotionStatus"
    );

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get coupon by code successfully",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/me
const getMyCoupons = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }
    const customer = await Customer.findOne({ account_id: accountId }).select("_id");
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const redemptions = await CouponRedemption.find({
      customer_id: customer._id,
      redemptionStatus: { $ne: "cancelled" },
    })
      .populate("couponId", "couponCode couponStatus")
      .sort({ redeemedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Get my coupons successfully",
      data: {
        items: redemptions,
        count: redemptions.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons
const createCoupon = async (req, res) => {
  try {
    const { promotionId, couponCode } = req.body;

    if (!promotionId || !couponCode) {
      return res.status(400).json({
        success: false,
        message: "promotionId and couponCode are required",
      });
    }

    if (!validateObjectId(promotionId)) {
      return res.status(400).json({ success: false, message: "Invalid promotionId" });
    }

    const promotionExists = await Promotion.findById(promotionId);
    if (!promotionExists) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }

    const coupon = await Coupon.create(req.body);

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/coupons/:id
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/coupons/:id
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// PATCH /api/coupons/:id
const patchCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    const allowed = ["couponStatus", "validFrom", "validTo", "usageLimitTotal", "usageLimitPerCustomer", "minOrderAmount"];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.status(200).json({ success: true, message: "Coupon patched successfully", data: coupon });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = {
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  getMyCoupons,
  createCoupon,
  updateCoupon,
  patchCoupon,
  deleteCoupon,
};
