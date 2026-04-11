import { useState, useEffect } from "react";
import { reviewAPI } from "../services/api";
import "./ReviewSection.css";

export default function ReviewSection({ bookId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentReaderId, setCurrentReaderId] = useState(null);

  useEffect(() => {
    // Validate bookId
    if (!bookId) {
      console.error("ReviewSection: bookId is required");
      return;
    }

    console.log("ReviewSection initialized with bookId:", bookId);

    // Check if user is logged in
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    setIsLoggedIn(!!token);

    // Get current reader id from userData
    const userData = localStorage.getItem("userData");
    if (userData) {
      try { setCurrentReaderId(JSON.parse(userData).reader_id); } catch (_) {}
    }

    // Fetch reviews
    fetchReviews();
    
    // Fetch user's review if logged in
    if (token) {
      fetchUserReview(token);
    }
  }, [bookId]);

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getReviewsByBook(bookId);
      if (response.success) {
        setReviews(response.reviews);
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const fetchUserReview = async (token) => {
    try {
      const response = await reviewAPI.getUserReview(token, bookId);
      if (response.success && response.review) {
        setUserReview(response.review);
        setRating(response.review.rating);
        setReviewText(response.review.review_text || "");
      }
    } catch (error) {
      console.error("Failed to fetch user review:", error);
    }
  };

  const handleStarClick = (selectedRating) => {
    if (!isLoggedIn) {
      setMessage({ type: "error", text: "Please login to rate this book" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      return;
    }

    setRating(selectedRating);
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setMessage({ type: "error", text: "Please login to submit a review" });
      return;
    }

    if (rating === 0) {
      setMessage({ type: "error", text: "Please select a rating" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      
      const payload = {
        bookId: Number(bookId),
        rating: Number(rating),
        reviewText: reviewText.trim() || null,
      };

      const response = await reviewAPI.addReview(token, payload);

      if (response.success) {
        setMessage({ type: "success", text: response.message });
        setShowReviewForm(false);
        fetchReviews();
        fetchUserReview(token);
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to submit review" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!userReview) {
      setRating(0);
      setReviewText("");
    } else {
      setRating(userReview.rating);
      setReviewText(userReview.review_text || "");
    }
    setShowReviewForm(false);
    setMessage({ type: "", text: "" });
  };

  const renderStars = (count, interactive = false) => {
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= (interactive ? (hoverRating || rating) : count) ? "filled" : ""}`}
            onClick={() => interactive && handleStarClick(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="review-section">
      {/* Rating Summary */}
      <div className="review-summary">
        <h2>Ratings & Reviews</h2>
        <div className="rating-overview">
          <div className="average-rating">
            <span className="rating-number">{stats.averageRating.toFixed(1)}</span>
            {renderStars(Math.round(stats.averageRating))}
            <span className="total-reviews">{stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}</span>
          </div>
        </div>
      </div>

      {/* Write Review — only show if user hasn't reviewed yet */}
      {!showReviewForm && !userReview && (
        <div className="write-review-prompt">
          <button
            className="btn-write-review"
            onClick={() => {
              if (!isLoggedIn) {
                setMessage({ type: "error", text: "Please login to write a review" });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                return;
              }
              setShowReviewForm(true);
            }}
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="review-form-container">
          <div className="review-form-header">
            <div className="user-icon">👤</div>
            <div>
              <h3>Share Your Thoughts</h3>
              <p>Your review helps others make informed decisions</p>
            </div>
          </div>

          {message.text && (
            <div className={`review-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="rating-input">
              {renderStars(rating, true)}
            </div>

            <div className="review-input">
              <label>Your Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think about this book?"
                rows={5}
              />
            </div>

            <div className="review-actions">
              <button 
                type="submit" 
                className="btn-submit-review"
                disabled={loading || rating === 0}
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
              <button 
                type="button" 
                className="btn-cancel-review"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review this book!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.review_id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.reader_name || "Anonymous"}</span>
                  {renderStars(review.rating)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  {/* Edit button only for the review owner */}
                  {currentReaderId && String(review.reader_id) === String(currentReaderId) && !showReviewForm && (
                    <button
                      style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6,
                        background: "#f0f0f0", border: "none", cursor: "pointer",
                        color: "#555", fontWeight: 600 }}
                      onClick={() => {
                        setRating(review.rating);
                        setReviewText(review.review_text || "");
                        setShowReviewForm(true);
                      }}>
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
    </div>
  );
}
