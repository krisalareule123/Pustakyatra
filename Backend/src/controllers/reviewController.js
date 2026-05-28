const db = require("../config/db");

// ─── Helper: check reader has paid access to a book ──────────────────────────
function checkBookAccess(readerId, bookId, cb) {
  db.query(
    `SELECT oi.item_type FROM orders o
     JOIN order_items oi ON oi.order_id = o.order_id
     WHERE o.reader_id = ? AND oi.book_id = ? AND o.status = 'paid'
     LIMIT 1`,
    [readerId, bookId],
    (err, rows) => cb(err, rows && rows.length > 0)
  );
}

// ─── PUBLIC RATING / REVIEW ───────────────────────────────────────────────────
// POST /api/reviews  — add or update a public rating+review for a book
// Any logged-in reader can submit. Visible to all after admin approval.
// Promo reward is NOT triggered here.
const addReview = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId, rating, reviewText } = req.body;

    if (!bookId || !rating) {
      return res.status(400).json({ success: false, message: "Please provide book ID and rating" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    // Check for existing public review
    db.query(
      "SELECT * FROM reviews WHERE reader_id = ? AND book_id = ? AND review_type = 'public'",
      [readerId, bookId],
      (err2, existing) => {
        if (err2) return res.status(500).json({ success: false, message: "Server error. Please try again later" });

        if (existing.length > 0) {
          // Update existing public review
          db.query(
            "UPDATE reviews SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE reader_id = ? AND book_id = ? AND review_type = 'public'",
            [rating, reviewText || null, readerId, bookId],
            (err3) => {
              if (err3) return res.status(500).json({ success: false, message: "Failed to update review. Please try again" });
              res.status(200).json({
                success: true,
                message: "Review updated successfully",
                review: { review_id: existing[0].review_id, reader_id: readerId, book_id: bookId, rating, review_text: reviewText || null }
              });
            }
          );
        } else {
          // Insert new public review — immediately visible, no admin approval needed
          db.query(
            "INSERT INTO reviews (reader_id, book_id, rating, comment, review_type, status) VALUES (?, ?, ?, ?, 'public', 'visible')",
            [readerId, bookId, rating, reviewText || null],
            (err3, result) => {
              if (err3) return res.status(500).json({ success: false, message: "Failed to submit review. Please try again" });

              // Notify admin for moderation (non-blocking)
              const { createAdminNotification } = require("./adminController");
              db.query(
                "SELECT b.title, rd.full_name AS reader_name FROM books b, readers rd WHERE b.book_id = ? AND rd.reader_id = ?",
                [bookId, readerId],
                (e, rows) => {
                  if (!e && rows?.[0]) {
                    createAdminNotification("review_new",
                      `${rows[0].reader_name} submitted a ${rating}★ public review on "${rows[0].title}"`, bookId);
                  }
                }
              );

              res.status(201).json({
                success: true,
                message: "Review submitted! It will appear publicly after admin approval.",
                review: { review_id: result.insertId, reader_id: readerId, book_id: bookId, rating, review_text: reviewText || null }
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// ─── PRIVATE AUTHOR FEEDBACK ──────────────────────────────────────────────────
// POST /api/reviews/private  — submit private feedback to the book's author
// NOT visible to other readers. Triggers promo reward if author has one active.
const addPrivateFeedback = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId, rating, reviewText } = req.body;

    if (!bookId || !rating) {
      return res.status(400).json({ success: false, message: "Please provide book ID and rating" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }
    if (!reviewText || !reviewText.trim()) {
      return res.status(400).json({ success: false, message: "Please write your feedback message for the author." });
    }

    // Only readers who purchased or rented the book can leave private feedback
    checkBookAccess(readerId, bookId, (err, hasAccess) => {
      if (err) {
        console.error("DB error checking access:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You can only send feedback for books you have purchased or rented."
        });
      }

      // Check for existing private feedback
      db.query(
        "SELECT * FROM reviews WHERE reader_id = ? AND book_id = ? AND review_type = 'private'",
        [readerId, bookId],
        (err2, existing) => {
          if (err2) return res.status(500).json({ success: false, message: "Server error. Please try again later" });

          if (existing.length > 0) {
            // Update existing private feedback
            db.query(
              "UPDATE reviews SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE reader_id = ? AND book_id = ? AND review_type = 'private'",
              [rating, reviewText.trim(), readerId, bookId],
              (err3) => {
                if (err3) return res.status(500).json({ success: false, message: "Failed to update feedback. Please try again" });
                res.status(200).json({
                  success: true,
                  message: "Your feedback has been updated.",
                  review: { review_id: existing[0].review_id, reader_id: readerId, book_id: bookId, rating, review_text: reviewText.trim() }
                });
              }
            );
          } else {
            // Insert new private feedback — starts as 'pending', admin must approve before author sees it
            db.query(
              "INSERT INTO reviews (reader_id, book_id, rating, comment, review_type, status) VALUES (?, ?, ?, ?, 'private', 'pending')",
              [readerId, bookId, rating, reviewText.trim()],
              (err3, result) => {
                if (err3) return res.status(500).json({ success: false, message: "Failed to submit feedback. Please try again" });

                // Notify the book's author (non-blocking)
                const { createAuthorNotification } = require("./bookController");
                const { createAdminNotification }  = require("./adminController");
                db.query(
                  "SELECT b.author_id, b.title, rd.full_name AS reader_name FROM books b, readers rd WHERE b.book_id = ? AND rd.reader_id = ?",
                  [bookId, readerId],
                  (e, rows) => {
                    if (!e && rows?.[0]?.author_id) {
                      const readerName = rows[0].reader_name || "A reader";
                      const bookTitle  = rows[0].title;
                      createAuthorNotification(
                        rows[0].author_id, bookId, "review",
                        `${readerName} sent you private feedback (${rating}★) on "${bookTitle}"`,
                        readerId
                      );
                      createAdminNotification("review_new",
                        `${readerName} submitted private feedback on "${bookTitle}"`, bookId);
                    }
                  }
                );

                res.status(201).json({
                  success: true,
                  message: "Your private feedback has been sent to the author.",
                  review: { review_id: result.insertId, reader_id: readerId, book_id: bookId, rating, review_text: reviewText.trim() }
                });

                // Fire promo reward — only on private feedback, not public reviews
                const { checkReviewReward } = require("./promoController");
                checkReviewReward(bookId, readerId);
              }
            );
          }
        }
      );
    });
  } catch (error) {
    console.error("Add private feedback error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// ─── GET PUBLIC REVIEWS for a book (visible to all readers) ──────────────────
// Only returns status='visible' reviews of type='public'
const getReviewsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!bookId) {
      return res.status(400).json({ success: false, message: "Please provide book ID" });
    }

    const query = `
      SELECT
        r.review_id, r.reader_id, r.book_id, r.rating,
        r.comment AS review_text, r.created_at, r.updated_at,
        rd.full_name AS reader_name
      FROM reviews r
      LEFT JOIN readers rd ON r.reader_id = rd.reader_id
      WHERE r.book_id = ?
        AND r.review_type = 'public'
        AND r.status = 'visible'
      ORDER BY r.created_at DESC
    `;

    db.query(query, [bookId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      const totalRatings = results.length;
      const averageRating = totalRatings > 0
        ? (results.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
        : 0;

      res.status(200).json({
        success: true,
        reviews: results,
        stats: { totalReviews: totalRatings, averageRating: parseFloat(averageRating) }
      });
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// ─── GET reader's own public review for a book ───────────────────────────────
const getUserReview = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId } = req.params;
    if (!bookId) return res.status(400).json({ success: false, message: "Please provide book ID" });

    db.query(
      "SELECT review_id, reader_id, book_id, rating, comment AS review_text, created_at, updated_at FROM reviews WHERE reader_id = ? AND book_id = ? AND review_type = 'public'",
      [readerId, bookId],
      (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Server error. Please try again later" });
        res.status(200).json({ success: true, review: results[0] || null });
      }
    );
  } catch (error) {
    console.error("Get user review error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// ─── GET reader's own private feedback for a book ────────────────────────────
const getUserPrivateFeedback = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId } = req.params;
    if (!bookId) return res.status(400).json({ success: false, message: "Please provide book ID" });

    db.query(
      "SELECT review_id, reader_id, book_id, rating, comment AS review_text, created_at, updated_at FROM reviews WHERE reader_id = ? AND book_id = ? AND review_type = 'private'",
      [readerId, bookId],
      (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Server error. Please try again later" });
        res.status(200).json({ success: true, feedback: results[0] || null });
      }
    );
  } catch (error) {
    console.error("Get user private feedback error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// ─── Check if reader has purchased/rented a book (for frontend gating) ───────
const checkReaderAccess = (req, res) => {
  const readerId = req.user.reader_id;
  const { bookId } = req.params;
  checkBookAccess(readerId, bookId, (err, hasAccess) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true, hasAccess });
  });
};

// ─── Reward hint — returns active review_reward promo info for the book's author ──
// Used by frontend to show the promo hint before the reader submits private feedback
const getRewardHint = async (req, res) => {
  try {
    const { bookId } = req.params;
    const db2 = require("../config/db");

    db2.query(
      `SELECT pc.code, pc.discount_type, pc.discount_value, pc.expiry_date
       FROM promo_codes pc
       JOIN books b ON b.author_id = pc.author_id
       WHERE b.book_id = ? AND pc.occasion = 'review_reward' AND pc.status = 'active'
         AND pc.expiry_date >= CURDATE()
         AND (pc.promo_scope = 'all_books' OR pc.book_id = ?)
       LIMIT 1`,
      [bookId, bookId],
      (err, rows) => {
        if (err || !rows || rows.length === 0) {
          return res.json({ success: true, hint: null });
        }
        const p = rows[0];
        const discountText = p.discount_type === "percentage"
          ? `${p.discount_value}% off`
          : `Rs ${p.discount_value} off`;
        res.json({
          success: true,
          hint: {
            code: p.code,
            discountText,
            expiry: new Date(p.expiry_date).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })
          }
        });
      }
    );
  } catch (err) {
    res.json({ success: true, hint: null }); // non-critical, fail silently
  }
};

// ─── DELETE a review (reader can delete their own) ───────────────────────────
const deleteReview = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { reviewId } = req.params;
    if (!reviewId) return res.status(400).json({ success: false, message: "Please provide review ID" });

    db.query("SELECT * FROM reviews WHERE review_id = ? AND reader_id = ?", [reviewId, readerId], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      if (results.length === 0) return res.status(404).json({ success: false, message: "Review not found or you don't have permission to delete it" });

      db.query("DELETE FROM reviews WHERE review_id = ? AND reader_id = ?", [reviewId, readerId], (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "Failed to delete review. Please try again" });
        res.status(200).json({ success: true, message: "Review deleted successfully" });
      });
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

module.exports = {
  addReview,
  addPrivateFeedback,
  getReviewsByBook,
  getUserReview,
  getUserPrivateFeedback,
  checkReaderAccess,
  getRewardHint,
  deleteReview
};
