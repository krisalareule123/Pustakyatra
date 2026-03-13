const express = require("express");
const {
  addReview,
  getReviewsByBook,
  getUserReview,
  deleteReview
} = require("../controllers/reviewController");
const authReader = require("../middleware/authReader");

const router = express.Router();

// Public routes
router.get("/book/:bookId", getReviewsByBook);

// Protected routes (require authentication)
router.post("/", authReader, addReview);
router.get("/user/:bookId", authReader, getUserReview);
router.delete("/:reviewId", authReader, deleteReview);

module.exports = router;
