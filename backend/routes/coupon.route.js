const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllCoupons,
  getCouponById,
  getCouponByCode,
  getMyCoupons,
  createCoupon,
  updateCoupon,
  patchCoupon,
  deleteCoupon,
} = require("../controllers/coupon.controller");

router.get("/me", authMiddleware, getMyCoupons);
router.get("/", getAllCoupons);
router.get("/code/:couponCode", getCouponByCode);
router.get("/:id", getCouponById);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.patch("/:id", patchCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
