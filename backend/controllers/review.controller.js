const Review = require("../models/review.model");
const ReviewSummary = require("../models/reviewSummary.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const ReviewMedia = require("../models/reviewMedia.model");
const ReviewVote = require("../models/reviewVote.model");
const OrderItem = require("../models/orderItem.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name avatar_url";

// Helper: recalculate review summary for a product (approved reviews only)
const recalcReviewSummary = async (productId) => {
  const reviews = await Review.find({ productId, reviewStatus: "approved" });
  const reviewCount = reviews.length;
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  reviews.forEach((r) => { ratingCounts[r.rating]++; totalRating += r.rating; });
  const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

  await ReviewSummary.findOneAndUpdate(
    { productId },
    { reviewCount, averageRating, rating1Count: ratingCounts[1], rating2Count: ratingCounts[2], rating3Count: ratingCounts[3], rating4Count: ratingCounts[4], rating5Count: ratingCounts[5] },
    { upsert: true, new: true }
  );
};

const getCustomerFromAuth = async (req) => {
  const accountId = req.user?.account_id || req.user?.accountId;
  if (!accountId) return null;
  return Customer.findOne({ account_id: accountId });
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate("customer_id", CUST).populate("productId", "productName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all reviews successfully", count: reviews.length, data: reviews });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const review = await Review.findById(id).populate("customer_id", CUST).populate("productId", "productName").populate("variantId", "sku variantName");
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    res.status(200).json({ success: true, message: "Get review successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid product ID" });
    const reviews = await Review.find({ productId, reviewStatus: "approved" })
      .populate("customer_id", CUST)
      .populate("variantId", "variantName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.status(200).json({ success: true, message: "Get reviews by product successfully", count: reviews.length, data: reviews });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReview = async (req, res) => {
  try {
    const { productId, rating } = req.body;
    const customer_id = pickCustomerId(req.body);
    if (!customer_id || !productId || !rating) return res.status(400).json({ success: false, message: "customer_id, productId, and rating are required" });
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer_id" });
    if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });
    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });
    const productExists = await Product.findById(productId);
    if (!productExists) return res.status(404).json({ success: false, message: "Product not found" });

    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    const review = await Review.create(payload);
    await recalcReviewSummary(productId);
    res.status(201).json({ success: true, message: "Review created successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// GET /api/reviews/write-eligibility/:orderItemId
// Returns whether the authenticated customer can write a review for an order item.
const getReviewWriteEligibility = async (req, res) => {
  try {
    const { orderItemId } = req.params;
    if (!validateObjectId(orderItemId)) return res.status(400).json({ success: false, message: "Invalid orderItemId" });

    const customer = await getCustomerFromAuth(req);
    if (!customer) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orderItem = await OrderItem.findById(orderItemId)
      .populate("order_id", "order_number order_status payment_status customer_id placed_at")
      .populate("variant_id", "sku variantName")
      .populate("product_id", "productName imageUrl");

    if (!orderItem) return res.status(404).json({ success: false, message: "Order item not found" });
    const order = orderItem.order_id;

    if (!order?.customer_id || String(order.customer_id) !== String(customer._id)) {
      return res.status(403).json({ success: false, message: "You are not allowed to review this order item" });
    }

    const paymentOk = ["paid", "partially_refunded"].includes(order.payment_status);
    const eligibleOrder = order.order_status === "completed" && paymentOk;
    const verifiedPurchase = eligibleOrder;

    // If customer already submitted a review for this order item, block duplicates.
    const existing = await Review.findOne({ orderItemId: orderItem._id, customer_id: customer._id });

    res.status(200).json({
      success: true,
      message: "Eligibility retrieved",
      data: {
        eligible: !!verifiedPurchase,
        verifiedPurchaseFlag: verifiedPurchase,
        existingReview: existing
          ? {
              id: String(existing._id),
              reviewStatus: existing.reviewStatus,
              rating: existing.rating,
            }
          : null,
        preview: {
          orderItemId: String(orderItem._id),
          productId: String(orderItem.product_id?._id ?? orderItem.product_id),
          productName: orderItem.product_id?.productName ?? "",
          productImageUrl: orderItem.product_id?.imageUrl ?? "",
          variantId: String(orderItem.variant_id?._id ?? orderItem.variant_id),
          variantLabel: orderItem.variant_id?.variantName ?? "",
          sku: orderItem.variant_id?.sku ?? "",
          orderNumber: order.order_number,
          orderPlacedAt: order.placed_at,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/reviews/submit
// Creates review (pending) + review_media; sets verifiedPurchaseFlag based on completed order item.
const submitReviewFromOrderItem = async (req, res) => {
  try {
    const customer = await getCustomerFromAuth(req);
    if (!customer) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { orderItemId, rating, reviewTitle, reviewContent, mediaUrls } = req.body ?? {};

    if (!orderItemId || !validateObjectId(orderItemId)) return res.status(400).json({ success: false, message: "Valid orderItemId is required" });
    if (!rating || !Number.isFinite(Number(rating))) return res.status(400).json({ success: false, message: "Rating is required" });

    const orderItem = await OrderItem.findById(orderItemId).populate("order_id", "order_status payment_status customer_id").populate("variant_id", "_id").populate("product_id", "_id");
    if (!orderItem) return res.status(404).json({ success: false, message: "Order item not found" });

    if (!orderItem.order_id?.customer_id || String(orderItem.order_id.customer_id) !== String(customer._id)) {
      return res.status(403).json({ success: false, message: "You are not allowed to review this order item" });
    }
    const paymentOk = ["paid", "partially_refunded"].includes(orderItem.order_id.payment_status);
    if (orderItem.order_id.order_status !== "completed" || !paymentOk) {
      return res.status(403).json({ success: false, message: "You can only review after a completed and paid order" });
    }

    const existing = await Review.findOne({ orderItemId: orderItem._id, customer_id: customer._id });
    if (existing) return res.status(409).json({ success: false, message: "You have already submitted a review for this item" });

    const payload = {
      customer_id: customer._id,
      orderItemId: orderItem._id,
      productId: orderItem.product_id?._id ?? orderItem.product_id,
      variantId: orderItem.variant_id?._id ?? orderItem.variant_id,
      rating: Number(rating),
      reviewTitle: reviewTitle ?? "",
      reviewContent: reviewContent ?? "",
      verifiedPurchaseFlag: true,
      reviewStatus: "pending",
    };

    const created = await Review.create(payload);

    const mediaList = Array.isArray(mediaUrls) ? mediaUrls.filter(Boolean).slice(0, 8) : [];
    if (mediaList.length) {
      await ReviewMedia.insertMany(
        mediaList.map((mediaUrl, idx) => ({
          reviewId: created._id,
          mediaType: "image",
          mediaUrl: String(mediaUrl),
          sortOrder: idx,
        }))
      );
    }

    // summary only counts approved reviews
    await recalcReviewSummary(created.productId);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reviews/me
const getMyReviews = async (req, res) => {
  try {
    const customer = await getCustomerFromAuth(req);
    if (!customer) return res.status(401).json({ success: false, message: "Unauthorized" });

    const reviews = await Review.find({ customer_id: customer._id })
      .populate("productId", "productName imageUrl slug")
      .populate("variantId", "variantName sku")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "My reviews retrieved",
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/reviews/submit-direct
// Creates a review directly from the product page (no order item required).
// verifiedPurchaseFlag is always false for direct reviews.
const submitReviewDirect = async (req, res) => {
  try {
    const customer = await getCustomerFromAuth(req);
    if (!customer) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để viết đánh giá." });

    const { productId, variantId, rating, reviewTitle, reviewContent, mediaUrls } = req.body ?? {};

    if (!productId || !validateObjectId(productId)) return res.status(400).json({ success: false, message: "productId is required" });
    if (!rating || !Number.isFinite(Number(rating))) return res.status(400).json({ success: false, message: "Rating is required" });

    const productExists = await Product.findById(productId);
    if (!productExists) return res.status(404).json({ success: false, message: "Product not found" });

    // Prevent duplicate reviews for same product by same customer
    const existing = await Review.findOne({ productId, customer_id: customer._id });
    if (existing) return res.status(409).json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi." });

    const payload = {
      customer_id: customer._id,
      productId,
      variantId: variantId && validateObjectId(variantId) ? variantId : undefined,
      rating: Math.max(1, Math.min(5, Number(rating))),
      reviewTitle: reviewTitle ?? "",
      reviewContent: reviewContent ?? "",
      verifiedPurchaseFlag: false,
      reviewStatus: "pending",
    };

    const created = await Review.create(payload);

    const mediaList = Array.isArray(mediaUrls) ? mediaUrls.filter(Boolean).slice(0, 8) : [];
    if (mediaList.length) {
      await ReviewMedia.insertMany(
        mediaList.map((mediaUrl, idx) => ({
          reviewId: created._id,
          mediaType: "image",
          mediaUrl: String(mediaUrl),
          sortOrder: idx,
        }))
      );
    }

    await recalcReviewSummary(productId);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/reviews/me/:id
const patchMyReview = async (req, res) => {
  try {
    const customer = await getCustomerFromAuth(req);
    if (!customer) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid review id" });

    const existing = await Review.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Review not found" });
    if (String(existing.customer_id) !== String(customer._id)) return res.status(403).json({ success: false, message: "Forbidden" });
    if (existing.reviewStatus === "approved") return res.status(403).json({ success: false, message: "Approved reviews cannot be edited" });

    const allowed = ["rating", "reviewTitle", "reviewContent"];
    const updates = {};
    for (const k of allowed) if (req.body?.[k] !== undefined) updates[k] = req.body[k];

    const updated = await Review.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    await recalcReviewSummary(existing.productId);

    res.status(200).json({ success: true, message: "Review updated", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/reviews/me/:id
const deleteMyReview = async (req, res) => {
  try {
    const customer = await getCustomerFromAuth(req);
    if (!customer) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid review id" });

    const existing = await Review.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Review not found" });
    if (String(existing.customer_id) !== String(customer._id)) return res.status(403).json({ success: false, message: "Forbidden" });

    // cleanup related media/votes
    await ReviewMedia.deleteMany({ reviewId: existing._id });
    await ReviewVote.deleteMany({ reviewId: existing._id });
    await Review.findByIdAndDelete(id);

    await recalcReviewSummary(existing.productId);
    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const existing = await Review.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Review not found" });
    const review = await Review.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    await recalcReviewSummary(review.productId);
    res.status(200).json({ success: true, message: "Review updated successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const review = await Review.findByIdAndDelete(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    await recalcReviewSummary(review.productId);
    res.status(200).json({ success: true, message: "Review deleted successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
// PATCH /api/reviews/:id
const patchReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const allowed = ["reviewStatus", "adminNote"];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    const review = await Review.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("customer_id", CUST).populate("productId", "productName");
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    await recalcReviewSummary(review.productId);
    res.status(200).json({ success: true, message: "Review patched successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// GET /api/reviews/reviewable-items/:productId
// Returns order items that the current customer bought (completed orders) and hasn't reviewed yet.
const getReviewableItems = async (req, res) => {
  try {
    const customer = await getCustomerFromAuth(req);
    if (!customer) return res.status(401).json({ success: false, message: "Vui lòng đăng nhập để viết đánh giá." });

    const { productId } = req.params;
    if (!productId || !validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });

    // Find completed orders belonging to this customer
    const completedOrders = await Order.find({
      customer_id: customer._id,
      order_status: "completed",
      payment_status: { $in: ["paid", "partially_refunded"] },
    }).select("_id order_number placed_at").lean();

    if (!completedOrders.length) {
      return res.status(200).json({
        success: true,
        message: "No completed orders found",
        data: { items: [], alreadyReviewed: [] },
      });
    }

    const orderIds = completedOrders.map((o) => o._id);
    const orderMap = new Map(completedOrders.map((o) => [String(o._id), o]));

    // Find order items for this product in those completed orders
    const orderItems = await OrderItem.find({
      order_id: { $in: orderIds },
      product_id: productId,
    })
      .populate("variant_id", "variantName sku")
      .lean();

    if (!orderItems.length) {
      return res.status(200).json({
        success: true,
        message: "No order items for this product",
        data: { items: [], alreadyReviewed: [] },
      });
    }

    // Find existing reviews by this customer for these order items
    const orderItemIds = orderItems.map((oi) => oi._id);
    const existingReviews = await Review.find({
      customer_id: customer._id,
      orderItemId: { $in: orderItemIds },
    }).select("orderItemId reviewStatus rating").lean();

    const reviewedMap = new Map(existingReviews.map((r) => [String(r.orderItemId), r]));

    const items = [];
    const alreadyReviewed = [];

    for (const oi of orderItems) {
      const order = orderMap.get(String(oi.order_id));
      const existing = reviewedMap.get(String(oi._id));
      const entry = {
        orderItemId: String(oi._id),
        productId: String(oi.product_id),
        variantId: oi.variant_id?._id ? String(oi.variant_id._id) : String(oi.variant_id),
        variantLabel: oi.variant_id?.variantName || oi.variant_name_snapshot || "",
        sku: oi.variant_id?.sku || oi.sku_snapshot || "",
        productName: oi.product_name_snapshot || "",
        orderNumber: order?.order_number || "",
        purchaseDate: order?.placed_at || null,
        quantity: oi.quantity,
      };

      if (existing) {
        alreadyReviewed.push({
          ...entry,
          reviewId: String(existing._id),
          reviewStatus: existing.reviewStatus,
          rating: existing.rating,
        });
      } else {
        items.push(entry);
      }
    }

    res.status(200).json({
      success: true,
      message: "Reviewable items retrieved",
      data: { items, alreadyReviewed },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  getReviewsByProductId,
  createReview,
  updateReview,
  patchReview,
  deleteReview,
  // Customer-facing (auth)
  getReviewWriteEligibility,
  submitReviewFromOrderItem,
  submitReviewDirect,
  getMyReviews,
  patchMyReview,
  deleteMyReview,
  getReviewableItems,
};
