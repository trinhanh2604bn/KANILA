const express = require("express");
const router = express.Router();
const { getAllReviewSummaries, getReviewSummaryById, getSummaryByProductId, createReviewSummary, deleteReviewSummary } = require("../controllers/reviewSummary.controller");
router.get("/", getAllReviewSummaries);
router.get("/product/:productId", getSummaryByProductId);
router.get("/:id", getReviewSummaryById);
router.post("/", createReviewSummary);
router.delete("/:id", deleteReviewSummary);
module.exports = router;
