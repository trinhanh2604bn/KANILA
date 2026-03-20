const express = require("express");
const router = express.Router();
const {
  getAllCouponRedemptions,
  getCouponRedemptionById,
  getRedemptionsByCouponId,
  getRedemptionsByCustomerId,
  createCouponRedemption,
  updateCouponRedemption,
  deleteCouponRedemption,
} = require("../controllers/couponRedemption.controller");

router.get("/", getAllCouponRedemptions);
router.get("/coupon/:couponId", getRedemptionsByCouponId);
router.get("/customer/:customerId", getRedemptionsByCustomerId);
router.get("/:id", getCouponRedemptionById);
router.post("/", createCouponRedemption);
router.put("/:id", updateCouponRedemption);
router.delete("/:id", deleteCouponRedemption);

module.exports = router;
