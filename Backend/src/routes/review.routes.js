const express = require("express");
const {
  addReview,
  addPrivateFeedback,
  getReviewsByBook,
  getUserReview,
  getUserPrivateFeedback,
  checkReaderAccess,
  getRewardHint,
  deleteReview
} = require("../controllers/reviewController");
const authReader = require("../middleware/authReader");

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
// Returns only status='visible', review_type='public' reviews
router.get("/book/:bookId", getReviewsByBook);

// Reward hint — shows active promo info before reader submits private feedback
router.get("/reward-hint/:bookId", authReader, getRewardHint);

// ── Protected routes (reader must be logged in) ───────────────────────────────

// Public rating/review (visible to all readers after admin approval)
router.post("/", authReader, addReview);
router.get("/user/:bookId", authReader, getUserReview);

// Private author feedback (only visible to author + admin, triggers promo reward)
router.post("/private", authReader, addPrivateFeedback);
router.get("/private/user/:bookId", authReader, getUserPrivateFeedback);

// Check if reader has purchased/rented a book (used by frontend to show/hide forms)
router.get("/access/:bookId", authReader, checkReaderAccess);

// Delete (works for both types — reader can only delete their own)
router.delete("/:reviewId", authReader, deleteReview);

module.exports = router;
