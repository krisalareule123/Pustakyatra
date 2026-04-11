const db = require("../config/db");

// Add or Update Review
const addReview = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId, rating, reviewText } = req.body;

    console.log("Add Review Request:");
    console.log("- Reader ID:", readerId);
    console.log("- Request Body:", req.body);
    console.log("- bookId:", bookId, "Type:", typeof bookId);
    console.log("- rating:", rating, "Type:", typeof rating);
    console.log("- reviewText:", reviewText);

    // Validation
    if (!bookId || !rating) {
      console.log("Validation failed: Missing bookId or rating");
      return res.status(400).json({
        success: false,
        message: "Please provide book ID and rating"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if user already reviewed this book
    const checkQuery = "SELECT * FROM reviews WHERE reader_id = ? AND book_id = ?";
    db.query(checkQuery, [readerId, bookId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length > 0) {
        // Update existing review
        const updateQuery = `
          UPDATE reviews 
          SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
          WHERE reader_id = ? AND book_id = ?
        `;
        
        db.query(updateQuery, [rating, reviewText || null, readerId, bookId], (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              success: false,
              message: "Failed to update review. Please try again"
            });
          }

          res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review: {
              review_id: results[0].review_id,
              reader_id: readerId,
              book_id: bookId,
              rating,
              review_text: reviewText || null
            }
          });
        });
      } else {
        // Insert new review
        const insertQuery = `
          INSERT INTO reviews (reader_id, book_id, rating, comment)
          VALUES (?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [readerId, bookId, rating, reviewText || null], (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              success: false,
              message: "Failed to submit review. Please try again"
            });
          }

          // Notify the book's author with reader name (non-blocking)
          const { createAuthorNotification } = require("./bookController");
          const { createAdminNotification }  = require("./adminController");
          db.query(
            `SELECT b.author_id, b.title, rd.full_name AS reader_name
             FROM books b, readers rd
             WHERE b.book_id = ? AND rd.reader_id = ?`,
            [bookId, readerId],
            (e, rows) => {
              if (!e && rows && rows[0] && rows[0].author_id) {
                const readerName = rows[0].reader_name || "A reader";
                const bookTitle  = rows[0].title;
                createAuthorNotification(
                  rows[0].author_id, bookId, "review",
                  `${readerName} gave ${rating}★ review on "${bookTitle}"`,
                  readerId
                );
                // Notify admin too
                createAdminNotification("review_new",
                  `${readerName} submitted a ${rating}★ review on "${bookTitle}"`, bookId);
              }
            }
          );

          res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review: {
              review_id: result.insertId,
              reader_id: readerId,
              book_id: bookId,
              rating,
              review_text: reviewText || null
            }
          });
        });
      }
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Get Reviews by Book ID
const getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Please provide book ID"
      });
    }

    // Get all reviews with reader information
    const query = `
      SELECT 
        r.review_id,
        r.reader_id,
        r.book_id,
        r.rating,
        r.comment as review_text,
        r.created_at,
        r.updated_at,
        rd.full_name as reader_name
      FROM reviews r
      LEFT JOIN readers rd ON r.reader_id = rd.reader_id
      WHERE r.book_id = ?
      ORDER BY r.created_at DESC
    `;

    db.query(query, [bookId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      // Calculate average rating
      let averageRating = 0;
      let totalRatings = results.length;

      if (totalRatings > 0) {
        const sumRatings = results.reduce((sum, review) => sum + review.rating, 0);
        averageRating = (sumRatings / totalRatings).toFixed(1);
      }

      res.status(200).json({
        success: true,
        reviews: results,
        stats: {
          totalReviews: totalRatings,
          averageRating: parseFloat(averageRating)
        }
      });
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Get User's Review for a Book
const getUserReview = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId } = req.params;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Please provide book ID"
      });
    }

    const query = `
      SELECT 
        r.review_id,
        r.reader_id,
        r.book_id,
        r.rating,
        r.comment as review_text,
        r.created_at,
        r.updated_at
      FROM reviews r
      WHERE r.reader_id = ? AND r.book_id = ?
    `;

    db.query(query, [readerId, bookId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          review: null,
          message: "No review found"
        });
      }

      res.status(200).json({
        success: true,
        review: results[0]
      });
    });
  } catch (error) {
    console.error("Get user review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Delete Review
const deleteReview = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Please provide review ID"
      });
    }

    // Check if review belongs to user
    const checkQuery = "SELECT * FROM reviews WHERE review_id = ? AND reader_id = ?";
    db.query(checkQuery, [reviewId, readerId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Review not found or you don't have permission to delete it"
        });
      }

      // Delete review
      const deleteQuery = "DELETE FROM reviews WHERE review_id = ? AND reader_id = ?";
      db.query(deleteQuery, [reviewId, readerId], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to delete review. Please try again"
          });
        }

        res.status(200).json({
          success: true,
          message: "Review deleted successfully"
        });
      });
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

module.exports = {
  addReview,
  getReviewsByBook,
  getUserReview,
  deleteReview
};
