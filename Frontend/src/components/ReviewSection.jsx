import { useState, useEffect } from "react";
import { reviewAPI } from "../services/api";
import "./ReviewSection.css";

// ─── Star renderer ────────────────────────────────────────────────────────────
function Stars({ count, interactive = false, hoverRating = 0, onHover, onClick }) {
  return (
    <div className="review-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (interactive ? (hoverRating || count) : count) ? "filled" : ""}`}
          onClick={() => interactive && onClick && onClick(star)}
          onMouseEnter={() => interactive && onHover && onHover(star)}
          onMouseLeave={() => interactive && onHover && onHover(0)}
          disabled={!interactive}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── PUBLIC Ratings & Reviews — shown on Book Details page ───────────────────
// Private author feedback is a separate system in the Author Dashboard.
// It is NOT shown here.
export default function ReviewSection({ bookId }) {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  const isLoggedIn = !!token;

  const [currentReaderId, setCurrentReaderId] = useState(null);

  const [publicReviews, setPublicReviews] = useState([]);
  const [publicStats, setPublicStats]     = useState({ totalReviews: 0, averageRating: 0 });

  // Reader's own public review
  const [userReview, setUserReview] = useState(null);

  const [showForm, setShowForm]       = useState(false);
  const [rating, setRating]           = useState(0);
  const [hover, setHover]             = useState(0);
  const [reviewText, setReviewText]   = useState("");
  const [loading, setLoading]         = useState(false);
  const [msg, setMsg]                 = useState({ type: "", text: "" });

  useEffect(() => {
    if (!bookId) return;

    const userData = localStorage.getItem("userData");
    if (userData) {
      try { setCurrentReaderId(JSON.parse(userData).reader_id); } catch (_) {}
    }

    // Always load public reviews for everyone
    reviewAPI.getReviewsByBook(bookId)
      .then(r => { if (r.success) { setPublicReviews(r.reviews); setPublicStats(r.stats); } })
      .catch(console.error);

    // Load the logged-in reader's own review so they can edit it
    if (token) {
      reviewAPI.getUserReview(token, bookId)
        .then(r => {
          if (r.success && r.review) {
            setUserReview(r.review);
            setRating(r.review.rating);
            setReviewText(r.review.review_text || "");
          }
        })
        .catch(console.error);
    }
  }, [bookId]);

  const refreshReviews = () => {
    reviewAPI.getReviewsByBook(bookId)
      .then(r => { if (r.success) { setPublicReviews(r.reviews); setPublicStats(r.stats); } });
    reviewAPI.getUserReview(token, bookId)
      .then(r => {
        if (r.success && r.review) {
          setUserReview(r.review);
          setRating(r.review.rating);
          setReviewText(r.review.review_text || "");
        }
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setMsg({ type: "error", text: "Please select a rating." }); return; }
    setLoading(true); setMsg({ type: "", text: "" });
    try {
      const res = await reviewAPI.addReview(token, {
        bookId: Number(bookId),
        rating: Number(rating),
        reviewText: reviewText.trim() || null
      });
      if (res.success) {
        setMsg({ type: "success", text: "Review submitted successfully!" });
        setShowForm(false);
        refreshReviews();
        setTimeout(() => setMsg({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to submit review." });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (review) => {
    setRating(review.rating);
    setReviewText(review.review_text || "");
    setShowForm(true);
  };

  return (
    <div className="review-section">
      {/* ── Header: average rating summary ── */}
      <div className="review-summary">
        <h2>Ratings &amp; Reviews</h2>
        <div className="rating-overview">
          <div className="average-rating">
            <span className="rating-number">
              {publicStats.averageRating > 0 ? publicStats.averageRating.toFixed(1) : "—"}
            </span>
            {publicStats.averageRating > 0 && (
              <Stars count={Math.round(publicStats.averageRating)} />
            )}
            <span className="total-reviews">
              {publicStats.totalReviews > 0
                ? `${publicStats.totalReviews} ${publicStats.totalReviews === 1 ? "review" : "reviews"}`
                : "No reviews yet"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Reader's own existing review (edit card) ── */}
      {userReview && !showForm && (
        <div className="review-own-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#3b5723" }}>Your Review</span>
            <button className="btn-edit-review" onClick={() => openEdit(userReview)}>Edit</button>
          </div>
          <Stars count={userReview.rating} />
          {userReview.review_text && (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#444", lineHeight: 1.6 }}>
              {userReview.review_text}
            </p>
          )}
          {msg.text && <div className={`review-message ${msg.type}`} style={{ marginTop: 8 }}>{msg.text}</div>}
        </div>
      )}

      {/* ── Write / Edit form ── */}
      {showForm && (
        <div className="review-form-container">
          <div className="review-form-header">
            <div className="user-icon">⭐</div>
            <div>
              <h3>{userReview ? "Edit Your Review" : "Write a Review"}</h3>
              <p>Share your thoughts about this book with other readers.</p>
            </div>
          </div>
          {msg.text && <div className={`review-message ${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit} className="review-form">
            <div className="rating-input">
              <Stars count={rating} interactive hoverRating={hover} onHover={setHover} onClick={setRating} />
            </div>
            <div className="review-input">
              <label>
                Your Review{" "}
                <span style={{ color: "#aaa", fontWeight: 400, fontSize: 13 }}>(optional)</span>
              </label>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="What did you think about this book?"
                rows={4}
              />
            </div>
            <div className="review-actions">
              <button type="submit" className="btn-submit-review" disabled={loading || rating === 0}>
                {loading ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
              </button>
              <button
                type="button"
                className="btn-cancel-review"
                onClick={() => {
                  setShowForm(false);
                  setMsg({ type: "", text: "" });
                  if (userReview) { setRating(userReview.rating); setReviewText(userReview.review_text || ""); }
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Public reviews list ── */}
      <div className="reviews-list">
        {publicReviews.length === 0 ? (
          <p className="no-reviews">No public ratings or reviews yet.</p>
        ) : (
          publicReviews.map((review) => (
            <div key={review.review_id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.reader_name || "Anonymous"}</span>
                  <Stars count={review.rating} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString("en-NP", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </span>
                  {currentReaderId &&
                    String(review.reader_id) === String(currentReaderId) &&
                    !showForm && (
                      <button className="btn-edit-inline" onClick={() => openEdit(review)}>
                        Edit
                      </button>
                    )}
                </div>
              </div>
              {review.review_text && (
                <p className="review-content">{review.review_text}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Write review prompt — below the list ── */}
      {!showForm && !userReview && (
        <div className="write-review-prompt" style={{ marginTop: 20, marginBottom: 0 }}>
          {isLoggedIn ? (
            <button className="btn-write-review" onClick={() => setShowForm(true)}>
              ★ Write a Review
            </button>
          ) : (
            <p className="review-login-note" style={{ marginBottom: 0 }}>
              <a href="/login">Sign in</a> to rate and review this book.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
