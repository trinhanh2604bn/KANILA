const Coupon = require("../models/coupon.model");
const Promotion = require("../models/promotion.model");
const CouponRedemption = require("../models/couponRedemption.model");
const Customer = require("../models/customer.model");
const CustomerCoupon = require("../models/customerCoupon.model");
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

    const now = new Date();

    const owned = await CustomerCoupon.find({ customer_id: customer._id })
      .populate({
        path: "couponId",
        select: "couponCode couponStatus minOrderAmount validFrom validTo promotionId",
        populate: {
          path: "promotionId",
          select: "discountType discountValue maxDiscountAmount promotionName",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const redemptions = await CouponRedemption.find({ customer_id: customer._id, redemptionStatus: "used" })
      .select("couponId discountAmount redeemedAt")
      .lean();
    const redemptionByCoupon = new Map();
    for (const r of redemptions) redemptionByCoupon.set(String(r.couponId), r);

    const items = owned
      .filter((x) => x.couponId)
      .map((row) => {
        const coupon = row.couponId;
        const validTo = coupon.validTo ? new Date(coupon.validTo) : null;
        const isExpired = !!(validTo && validTo < now);
        const isUsed = row.status === "used";
        const expiringSoon =
          !isExpired && !isUsed && validTo ? validTo.getTime() - now.getTime() <= 3 * 24 * 60 * 60 * 1000 : false;
        const discountLabel =
          coupon?.promotionId?.discountType === "percentage"
            ? `Giảm ${Number(coupon.promotionId.discountValue || 0)}%`
            : coupon?.promotionId?.discountType === "free_shipping"
              ? "Miễn phí ship"
              : `Giảm ${Number(coupon?.promotionId?.discountValue || 0).toLocaleString("vi-VN")}đ`;
        const redemption = redemptionByCoupon.get(String(coupon._id));
        return {
          _id: String(row._id),
          customerCouponId: String(row._id),
          couponId: String(coupon._id),
          couponCode: coupon.couponCode || "",
          couponStatus: coupon.couponStatus || "inactive",
          ownershipStatus: row.status || "saved",
          isUsed,
          isExpired,
          expiringSoon,
          savedAt: row.savedAt,
          usedAt: row.usedAt || redemption?.redeemedAt || null,
          validFrom: coupon.validFrom || null,
          validTo: coupon.validTo || null,
          minOrderAmount: Number(coupon.minOrderAmount || 0),
          discountLabel,
          promotionName: coupon?.promotionId?.promotionName || "",
          discountType: coupon?.promotionId?.discountType || "fixed",
          discountValue: Number(coupon?.promotionId?.discountValue || 0),
          lastDiscountAmount: Number(redemption?.discountAmount || 0),
        };
      });

    const summary = {
      total: items.length,
      usable: items.filter((x) => !x.isUsed && !x.isExpired && x.couponStatus === "active").length,
      expiringSoon: items.filter((x) => x.expiringSoon).length,
      used: items.filter((x) => x.isUsed).length,
      expired: items.filter((x) => x.isExpired).length,
    };

    return res.status(200).json({
      success: true,
      message: "Get my coupons successfully",
      data: {
        items,
        summary,
        count: items.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/available
const getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const activeCoupons = await Coupon.find({
      couponStatus: "active",
      $or: [{ validFrom: null }, { validFrom: { $lte: now } }],
      $and: [{ $or: [{ validTo: null }, { validTo: { $gte: now } }] }],
    })
      .populate("promotionId", "promotionName discountType discountValue maxDiscountAmount")
      .sort({ createdAt: -1 })
      .lean();

    const accountId = req.user?.account_id || req.user?.accountId;
    let ownedCouponIds = new Set();
    if (accountId && validateObjectId(accountId)) {
      const customer = await Customer.findOne({ account_id: accountId }).select("_id").lean();
      if (customer?._id) {
        const owned = await CustomerCoupon.find({ customer_id: customer._id }).select("couponId").lean();
        ownedCouponIds = new Set(owned.map((x) => String(x.couponId)));
      }
    }

    const items = activeCoupons
      .filter((c) => c.promotionId)
      .map((c) => ({
        _id: String(c._id),
        couponCode: c.couponCode,
        minOrderAmount: Number(c.minOrderAmount || 0),
        validTo: c.validTo || null,
        discountType: c.promotionId.discountType,
        discountValue: Number(c.promotionId.discountValue || 0),
        promotionName: c.promotionId.promotionName || "",
        isSaved: ownedCouponIds.has(String(c._id)),
      }));

    return res.status(200).json({ success: true, message: "Get available coupons successfully", data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons/save/:couponId
const saveCouponForMe = async (req, res) => {
  try {
    const { couponId } = req.params;
    if (!validateObjectId(couponId)) return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }
    const customer = await Customer.findOne({ account_id: accountId }).select("_id");
    if (!customer) return res.status(404).json({ success: false, message: "Customer profile not found" });

    const coupon = await Coupon.findById(couponId).populate("promotionId", "promotionName").lean();
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    const now = new Date();
    if (coupon.couponStatus !== "active") return res.status(400).json({ success: false, message: "Coupon is inactive" });
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return res.status(400).json({ success: false, message: "Coupon is not active yet" });
    }
    if (coupon.validTo && new Date(coupon.validTo) < now) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    const existing = await CustomerCoupon.findOne({ customer_id: customer._id, couponId });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Coupon already saved",
        data: { customerCouponId: String(existing._id), alreadySaved: true },
      });
    }
    const created = await CustomerCoupon.create({ customer_id: customer._id, couponId, status: "saved" });
    return res.status(201).json({
      success: true,
      message: "Coupon saved successfully",
      data: { customerCouponId: String(created._id), couponCode: coupon.couponCode, promotionName: coupon?.promotionId?.promotionName || "" },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons/apply
const applyCoupon = async (req, res) => {
  try {
    const couponCode = String(req.body?.couponCode || "").trim().toUpperCase();
    const orderAmount = Number(req.body?.orderAmount || 0);
    if (!couponCode) return res.status(400).json({ success: false, message: "couponCode is required" });

    const coupon = await Coupon.findOne({ couponCode, couponStatus: "active" }).populate("promotionId").lean();
    if (!coupon || !coupon.promotionId) {
      return res.status(400).json({ success: false, code: "INVALID_COUPON", message: "Coupon is invalid or inactive" });
    }
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return res.status(400).json({ success: false, code: "INVALID_COUPON", message: "Coupon is not active yet" });
    }
    if (coupon.validTo && new Date(coupon.validTo) < now) {
      return res.status(400).json({ success: false, code: "INVALID_COUPON", message: "Coupon has expired" });
    }
    if (Number(coupon.minOrderAmount || 0) > orderAmount) {
      return res.status(400).json({ success: false, code: "INVALID_COUPON", message: "Order does not meet minimum amount for coupon" });
    }

    // Global usage limit
    const usedTotalCount = coupon.usageLimitTotal > 0 ? await CouponRedemption.countDocuments({ couponId: coupon._id, redemptionStatus: "used" }) : 0;
    if (coupon.usageLimitTotal > 0 && usedTotalCount >= coupon.usageLimitTotal) {
      return res.status(400).json({ success: false, code: "COUPON_USAGE_LIMIT_REACHED", message: "Coupon usage limit has been reached" });
    }

    const accountId = req.user?.account_id || req.user?.accountId;
    if (accountId && validateObjectId(accountId)) {
      const customer = await Customer.findOne({ account_id: accountId }).select("_id").lean();
      if (customer?._id) {
        // Per-customer usage limit
        if (coupon.usageLimitPerCustomer > 0) {
          const usedPerCustomerCount = await CouponRedemption.countDocuments({
            couponId: coupon._id,
            customer_id: customer._id,
            redemptionStatus: "used",
          });
          if (usedPerCustomerCount >= coupon.usageLimitPerCustomer) {
            return res.status(400).json({ success: false, code: "COUPON_PER_CUSTOMER_LIMIT_REACHED", message: "Coupon usage limit per customer has been reached" });
          }
        }

        const ownership = await CustomerCoupon.findOne({ customer_id: customer._id, couponId: coupon._id }).lean();
        if (!ownership) {
          return res.status(403).json({ success: false, code: "COUPON_NOT_OWNED", message: "Coupon has not been saved to account" });
        }
        if (ownership.status === "used") {
          return res.status(400).json({ success: false, code: "COUPON_USED", message: "Coupon has already been used" });
        }
      }
    }

    let discount = 0;
    if (coupon.promotionId.discountType === "percentage") {
      discount = Math.round((orderAmount * Number(coupon.promotionId.discountValue || 0)) / 100);
      const cap = Number(coupon.promotionId.maxDiscountAmount || 0);
      if (cap > 0) discount = Math.min(discount, cap);
    } else if (coupon.promotionId.discountType === "fixed") {
      discount = Math.max(0, Number(coupon.promotionId.discountValue || 0));
    } else if (coupon.promotionId.discountType === "free_shipping") {
      // Shipping fee is not part of orderAmount; we just validate.
      discount = 0;
    } else {
      discount = Math.max(0, Number(coupon.promotionId.discountValue || 0));
    }
    discount = Math.min(discount, orderAmount);

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      data: { couponId: String(coupon._id), couponCode, discountAmount: discount, orderAmount, finalAmount: Math.max(0, orderAmount - discount) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/:id/usage
const getCouponUsage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    const rows = await CouponRedemption.find({ couponId: id, redemptionStatus: "used" })
      .populate("customer_id", "customer_code full_name")
      .sort({ redeemedAt: -1 })
      .lean();
    return res.status(200).json({ success: true, message: "Get coupon usage successfully", data: rows, count: rows.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/coupons/:id/assign
const assignCouponToUsers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid coupon ID" });
    const customerIds = Array.isArray(req.body?.customerIds) ? req.body.customerIds : [];
    if (!customerIds.length) return res.status(400).json({ success: false, message: "customerIds are required" });
    const validIds = customerIds.filter((x) => validateObjectId(String(x)));
    if (!validIds.length) return res.status(400).json({ success: false, message: "No valid customer IDs" });
    const ops = validIds.map((customerId) => ({
      updateOne: {
        filter: { couponId: id, customer_id: customerId },
        update: { $setOnInsert: { couponId: id, customer_id: customerId, status: "saved", savedAt: new Date() } },
        upsert: true,
      },
    }));
    const result = await CustomerCoupon.bulkWrite(ops);
    return res.status(200).json({
      success: true,
      message: "Coupon assigned successfully",
      data: { matched: result.matchedCount || 0, upserted: result.upsertedCount || 0 },
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
  getAvailableCoupons,
  saveCouponForMe,
  applyCoupon,
  getCouponUsage,
  assignCouponToUsers,
  createCoupon,
  updateCoupon,
  patchCoupon,
  deleteCoupon,
};
