const express = require("express");
const router = express.Router();
const { getAllReviewMedia, getReviewMediaById, getMediaByReviewId, createReviewMedia, deleteReviewMedia } = require("../controllers/reviewMedia.controller");
router.get("/", getAllReviewMedia);
router.get("/review/:reviewId", getMediaByReviewId);
router.get("/:id", getReviewMediaById);
router.post("/", createReviewMedia);
router.delete("/:id", deleteReviewMedia);
module.exports = router;
