const express = require("express");
const router = express.Router();

// Phase 1 routes
const brandRoutes = require("./brand.route");
const categoryRoutes = require("./category.route");
const productRoutes = require("./product.route");
const productCategoryRoutes = require("./productCategory.route");

// Phase 2 routes
const authRoutes = require("./auth.route");
const accountRoutes = require("./account.route");
const customerRoutes = require("./customer.route");
const addressRoutes = require("./address.route");
const customerConsentRoutes = require("./customerConsent.route");
const customerPreferenceRoutes = require("./customerPreference.route");

// Phase 3 routes
const productMediaRoutes = require("./productMedia.route");
const productAttributeRoutes = require("./productAttribute.route");
const productOptionRoutes = require("./productOption.route");
const productOptionValueRoutes = require("./productOptionValue.route");
const productVariantRoutes = require("./productVariant.route");
const variantOptionValueRoutes = require("./variantOptionValue.route");
const variantMediaRoutes = require("./variantMedia.route");

// Phase 4 routes
const priceBookRoutes = require("./priceBook.route");
const priceBookEntryRoutes = require("./priceBookEntry.route");
const priceHistoryRoutes = require("./priceHistory.route");
const promotionRoutes = require("./promotion.route");
const promotionRuleRoutes = require("./promotionRule.route");
const promotionTargetRoutes = require("./promotionTarget.route");
const couponRoutes = require("./coupon.route");
const couponRedemptionRoutes = require("./couponRedemption.route");

// Phase 5 routes
const warehouseRoutes = require("./warehouse.route");
const inventoryBalanceRoutes = require("./inventoryBalance.route");
const inventoryTransactionRoutes = require("./inventoryTransaction.route");
const stockReservationRoutes = require("./stockReservation.route");

// Phase 6 routes
const cartRoutes = require("./cart.route");
const cartItemRoutes = require("./cartItem.route");
const checkoutSessionRoutes = require("./checkoutSession.route");
const checkoutAddressRoutes = require("./checkoutAddress.route");
const shippingMethodRoutes = require("./shippingMethod.route");
const checkoutShippingMethodRoutes = require("./checkoutShippingMethod.route");
const paymentMethodRoutes = require("./paymentMethod.route");

// Phase 7 routes
const orderRoutes = require("./order.route");
const orderItemRoutes = require("./orderItem.route");
const orderAddressRoutes = require("./orderAddress.route");
const orderTotalRoutes = require("./orderTotal.route");
const orderStatusHistoryRoutes = require("./orderStatusHistory.route");
const paymentIntentRoutes = require("./paymentIntent.route");
const paymentTransactionRoutes = require("./paymentTransaction.route");
const refundRoutes = require("./refund.route");
const shipmentRoutes = require("./shipment.route");
const shipmentItemRoutes = require("./shipmentItem.route");
const shipmentEventRoutes = require("./shipmentEvent.route");
const returnRoutes = require("./return.route");
const returnItemRoutes = require("./returnItem.route");
const wishlistRoutes = require("./wishlist.route");
const wishlistItemRoutes = require("./wishlistItem.route");
const reviewRoutes = require("./review.route");
const reviewMediaRoutes = require("./reviewMedia.route");
const reviewVoteRoutes = require("./reviewVote.route");
const reviewSummaryRoutes = require("./reviewSummary.route");
const loyaltyTierRoutes = require("./loyaltyTier.route");
const loyaltyAccountRoutes = require("./loyaltyAccount.route");
const loyaltyPointLedgerRoutes = require("./loyaltyPointLedger.route");
const adminRoutes = require("./admin.route");
const setupRoutes = require("./setup.route");

router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/product-categories", productCategoryRoutes);

router.use("/auth", authRoutes);
router.use("/accounts", accountRoutes);
router.use("/customers", customerRoutes);
router.use("/addresses", addressRoutes);
router.use("/customer-consents", customerConsentRoutes);
router.use("/customer-preferences", customerPreferenceRoutes);

router.use("/product-media", productMediaRoutes);
router.use("/product-attributes", productAttributeRoutes);
router.use("/product-options", productOptionRoutes);
router.use("/product-option-values", productOptionValueRoutes);
router.use("/product-variants", productVariantRoutes);
router.use("/variant-option-values", variantOptionValueRoutes);
router.use("/variant-media", variantMediaRoutes);

router.use("/price-books", priceBookRoutes);
router.use("/price-book-entries", priceBookEntryRoutes);
router.use("/price-history", priceHistoryRoutes);
router.use("/promotions", promotionRoutes);
router.use("/promotion-rules", promotionRuleRoutes);
router.use("/promotion-targets", promotionTargetRoutes);
router.use("/coupons", couponRoutes);
router.use("/coupon-redemptions", couponRedemptionRoutes);

router.use("/warehouses", warehouseRoutes);
router.use("/inventory-balances", inventoryBalanceRoutes);
router.use("/inventory-transactions", inventoryTransactionRoutes);
router.use("/stock-reservations", stockReservationRoutes);

router.use("/carts", cartRoutes);
router.use("/cart-items", cartItemRoutes);
router.use("/checkout-sessions", checkoutSessionRoutes);
router.use("/checkout-addresses", checkoutAddressRoutes);
router.use("/shipping-methods", shippingMethodRoutes);
router.use("/checkout-shipping-methods", checkoutShippingMethodRoutes);
router.use("/payment-methods", paymentMethodRoutes);

router.use("/orders", orderRoutes);
router.use("/order-items", orderItemRoutes);
router.use("/order-addresses", orderAddressRoutes);
router.use("/order-totals", orderTotalRoutes);
router.use("/order-status-history", orderStatusHistoryRoutes);
router.use("/payment-intents", paymentIntentRoutes);
router.use("/payment-transactions", paymentTransactionRoutes);
router.use("/refunds", refundRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/shipment-items", shipmentItemRoutes);
router.use("/shipment-events", shipmentEventRoutes);
router.use("/returns", returnRoutes);
router.use("/return-items", returnItemRoutes);
router.use("/wishlists", wishlistRoutes);
router.use("/wishlist-items", wishlistItemRoutes);
router.use("/reviews", reviewRoutes);
router.use("/review-media", reviewMediaRoutes);
router.use("/review-votes", reviewVoteRoutes);
router.use("/review-summary", reviewSummaryRoutes);
router.use("/loyalty-tiers", loyaltyTierRoutes);
router.use("/loyalty-accounts", loyaltyAccountRoutes);
router.use("/loyalty-point-ledger", loyaltyPointLedgerRoutes);
router.use("/admin", adminRoutes);
router.use("/setup", setupRoutes);

// One-time migration route (remove after running)
const migrateRoute = require("./migrate.route");
router.use("/migrate-fields", migrateRoute);

module.exports = router;




