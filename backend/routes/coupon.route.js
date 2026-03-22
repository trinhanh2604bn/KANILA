const express = require("express");
const router = express.Router();
const {
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  patchCoupon,
  deleteCoupon,
} = require("../controllers/coupon.controller");

router.get("/", getAllCoupons);
router.get("/code/:couponCode", getCouponByCode);
router.get("/:id", getCouponById);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.patch("/:id", patchCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
