import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { orderAPI, reviewAPI } from "../services/api";
import "./MyLibrary.css";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : null;

// Returns a human-readable time-left string using exact ms difference.
// e.g. "6 days 23 hours left", "2 hours 15 min left", "Expires today at 3:45 PM"
const timeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt) - new Date();
  if (diffMs <= 0) return null; // expired — handled separately

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours   = Math.floor(diffMs / (1000 * 60 * 60));
  const days         = Math.floor(totalHours / 24);
  const hours        = totalHours % 24;
  const minutes      = totalMinutes % 60;

  if (days >= 2) {
    return `${days} days ${hours} hr${hours !== 1 ? "s" : ""} left`;
  }
  if (days === 1) {
    return hours > 0
      ? `1 day ${hours} hr${hours !== 1 ? "s" : ""} left`
      : "1 day left";
  }
  if (totalHours >= 1) {
    return minutes > 0
      ? `${totalHours} hr${totalHours !== 1 ? "s" : ""} ${minutes} min left`
      : `${totalHours} hr${totalHours !== 1 ? "s" : ""} left`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes} min left`;
  }
  return "Expires very soon";
};

// Returns true if the expiry is within today (< 24 hours away)
const isExpiringSoon = (expiresAt) => {
  if (!expiresAt) return false;
  const diffMs = new Date(expiresAt) - new Date();
  return diffMs > 0 && diffMs < 3 * 24 * 60 * 60 * 1000; // within 3 days
};

const isExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) <= new Date();
};

const initials = (title) =>
  title ? title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "?";

export default function MyLibrary() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [openingBook, setOpeningBook] = useState(null); // bookId being opened

  // ── Private author feedback state ──────────────────────────────────────────
  // feedbackOpen: bookId whose form is currently open (only one at a time)
  const [feedbackOpen, setFeedbackOpen]   = useState(null);
  // feedbackDone: Set of bookIds where feedback was already submitted this session
  const [feedbackDone, setFeedbackDone]   = useState({});  // { bookId: existingFeedback | true }
  const [fbRating, setFbRating]           = useState(0);
  const [fbHover, setFbHover]             = useState(0);
  const [fbText, setFbText]               = useState("");
  const [fbLoading, setFbLoading]         = useState(false);
  const [fbMsg, setFbMsg]                 = useState({ bookId: null, type: "", text: "" });

  const token = localStorage.getItem("token") || localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    orderAPI.getLibrary(token)
      .then((res) => {
        if (res.success) {
          setBooks(res.library);
          // Load existing private feedback for each book (non-blocking)
          res.library.forEach(book => {
            reviewAPI.getUserPrivateFeedback(token, book.bookId)
              .then(r => {
                if (r.success && r.feedback) {
                  setFeedbackDone(prev => ({ ...prev, [book.bookId]: r.feedback }));
                }
              })
              .catch(() => {});
          });
        }
      })
      .catch((err) => setError(err.message || "Failed to load library"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleReadNow = async (bookId) => {
    if (!token) { navigate("/login"); return; }
    setOpeningBook(bookId);
    try {
      const res = await orderAPI.issueReadToken(token, bookId);
      if (res.success && res.readToken) {
        navigate(`/reader/${res.readToken}`);
      } else {
        setError(res.message || "Could not open book. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Could not open book.");
    } finally {
      setOpeningBook(null);
    }
  };

  // Open the private feedback form for a specific book
  const openFeedback = (bookId) => {
    const existing = feedbackDone[bookId];
    if (existing && typeof existing === "object") {
      setFbRating(existing.rating || 0);
      setFbText(existing.review_text || "");
    } else {
      setFbRating(0);
      setFbText("");
    }
    setFbMsg({ bookId: null, type: "", text: "" });
    setFeedbackOpen(bookId);
  };

  const closeFeedback = () => {
    setFeedbackOpen(null);
    setFbRating(0);
    setFbText("");
    setFbMsg({ bookId: null, type: "", text: "" });
  };

  const handleFeedbackSubmit = async (e, bookId) => {
    e.preventDefault();
    if (fbRating === 0) {
      setFbMsg({ bookId, type: "error", text: "Please select a rating." });
      return;
    }
    if (!fbText.trim()) {
      setFbMsg({ bookId, type: "error", text: "Please write your feedback message." });
      return;
    }
    setFbLoading(true);
    setFbMsg({ bookId: null, type: "", text: "" });
    try {
      const res = await reviewAPI.addPrivateFeedback(token, {
        bookId: Number(bookId),
        rating: Number(fbRating),
        reviewText: fbText.trim()
      });
      if (res.success) {
        setFeedbackDone(prev => ({
          ...prev,
          [bookId]: { rating: fbRating, review_text: fbText.trim() }
        }));
        setFbMsg({ bookId, type: "success", text: res.message });
        setFeedbackOpen(null);
        setTimeout(() => setFbMsg({ bookId: null, type: "", text: "" }), 5000);
      }
    } catch (err) {
      setFbMsg({ bookId, type: "error", text: err.message || "Failed to submit feedback." });
    } finally {
      setFbLoading(false);
    }
  };

  const filtered = books.filter((b) => {
    if (filter === "buy") return b.accessType === "buy";
    if (filter === "rent") return b.accessType === "rent";
    return true;
  });

  if (loading) {
    return (
      <div className="lib-page">
        <div className="lib-center">
          <div className="lib-spinner" />
          <p>Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lib-page">
      <div className="lib-wrap">

        {/* Header */}
        <div className="lib-header">
          <div>
            <h1 className="lib-title">My Library</h1>
            <p className="lib-sub">
              {books.length > 0 ? `${books.length} book${books.length !== 1 ? "s" : ""} in your collection` : "Your personal bookshelf"}
            </p>
          </div>
          <Link to="/browse" className="lib-btn-browse">Browse Books</Link>
        </div>

        {/* Filter tabs */}
        {books.length > 0 && (
          <div className="lib-filters">
            {[["all", "All Books"], ["buy", "Purchased"], ["rent", "Rented"]].map(([key, label]) => (
              <button
                key={key}
                className={"lib-filter" + (filter === key ? " lib-filter-active" : "")}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {error && <div className="lib-error">{error}</div>}

        {filtered.length === 0 ? (
          <div className="lib-empty">
            <span className="lib-empty-icon">📚</span>
            <p className="lib-empty-title">
              {books.length === 0 ? "Your library is empty" : "No books in this category"}
            </p>
            <p className="lib-empty-sub">
              {books.length === 0
                ? "Books you purchase or rent will appear here."
                : "Try a different filter."}
            </p>
            {books.length === 0 && (
              <Link to="/browse" className="lib-btn-browse">Browse Books</Link>
            )}
          </div>
        ) : (
          <div className="lib-grid">
            {filtered.map((book, i) => {
              const isRent = book.accessType === "rent";
              const expired = isRent ? isExpired(book.rentExpiresAt) : false;
              const expiringSoon = isRent && !expired ? isExpiringSoon(book.rentExpiresAt) : false;
              const remaining = isRent && !expired ? timeLeft(book.rentExpiresAt) : null;

              return (
                <div key={i} className={"lib-card" + (expired ? " lib-card-expired" : "")}>

                  {/* Book cover */}
                  <div className="lib-cover">
                    <span className="lib-cover-initials">{initials(book.bookTitle)}</span>
                    <span className={"lib-access-badge " + (isRent ? "badge-rent" : "badge-buy")}>
                      {isRent ? "Rent" : "Owned"}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="lib-info">
                    <h3 className="lib-book-title">{book.bookTitle}</h3>
                    {book.isDeleted && (
                      <p style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: 10, display: "inline-block", marginBottom: 4 }}>
                        No longer publicly available
                      </p>
                    )}

                    {/* Access status */}
                    {!isRent && (
                      <p className="lib-access-line lib-permanent">✓ Permanent access</p>
                    )}
                    {isRent && !expired && remaining !== null && (
                      <p className={"lib-access-line " + (expiringSoon ? "lib-expiring" : "lib-active-rent")}>
                        {remaining}
                        {book.rentExpiresAt && (
                          <span className="lib-expiry-date"> · Expires {fmtDate(book.rentExpiresAt)}</span>
                        )}
                      </p>
                    )}
                    {isRent && expired && (
                      <p className="lib-access-line lib-expired">Rental expired · {fmtDate(book.rentExpiresAt)}</p>
                    )}

                    {/* Actions */}
                    <div className="lib-actions">
                      {!expired && (
                        <button
                          className="lib-btn-read"
                          onClick={() => handleReadNow(book.bookId)}
                          disabled={openingBook === book.bookId}
                        >
                          {openingBook === book.bookId ? "Opening..." : "Read Now"}
                        </button>
                      )}
                      {expired && (
                        <Link to={`/book/${book.bookId}`} className="lib-btn-renew">
                          Renew Rental
                        </Link>
                      )}
                    </div>

                    {/* Private author feedback — only for non-expired books */}
                    {!expired && (
                      <div className="lib-feedback-section">
                        {/* Success message after submission */}
                        {fbMsg.bookId === book.bookId && fbMsg.type === "success" && (
                          <p className="lib-feedback-success">{fbMsg.text}</p>
                        )}

                        {/* Already submitted — show summary + edit option */}
                        {feedbackDone[book.bookId] && feedbackOpen !== book.bookId && (
                          <div className="lib-feedback-done">
                            <span className="lib-feedback-done-label">
                              ✉️ Feedback sent
                              {typeof feedbackDone[book.bookId] === "object" &&
                                ` · ${"★".repeat(feedbackDone[book.bookId].rating)}`}
                            </span>
                            <button
                              className="lib-feedback-edit-btn"
                              onClick={() => openFeedback(book.bookId)}
                            >
                              Edit
                            </button>
                          </div>
                        )}

                        {/* Prompt to send feedback (not yet submitted) */}
                        {!feedbackDone[book.bookId] && feedbackOpen !== book.bookId && (
                          <button
                            className="lib-btn-feedback"
                            onClick={() => openFeedback(book.bookId)}
                          >
                            ✉️ Send Feedback to Author
                          </button>
                        )}

                        {/* Inline feedback form */}
                        {feedbackOpen === book.bookId && (
                          <div className="lib-feedback-form">
                            <p className="lib-feedback-form-title">
                              🔒 Private Author Feedback
                              <span className="lib-feedback-private-note">Only the author and admin can see this</span>
                            </p>

                            {fbMsg.bookId === book.bookId && fbMsg.type === "error" && (
                              <p className="lib-feedback-error">{fbMsg.text}</p>
                            )}

                            <form onSubmit={(e) => handleFeedbackSubmit(e, book.bookId)}>
                              {/* Star rating */}
                              <div className="lib-feedback-stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={"lib-fb-star" + (star <= (fbHover || fbRating) ? " filled" : "")}
                                    onClick={() => setFbRating(star)}
                                    onMouseEnter={() => setFbHover(star)}
                                    onMouseLeave={() => setFbHover(0)}
                                    aria-label={`${star} star`}
                                  >★</button>
                                ))}
                              </div>

                              <textarea
                                className="lib-feedback-textarea"
                                value={fbText}
                                onChange={e => setFbText(e.target.value)}
                                placeholder="Share your thoughts with the author — writing quality, suggestions, overall experience..."
                                rows={3}
                                required
                              />

                              <div className="lib-feedback-actions">
                                <button
                                  type="submit"
                                  className="lib-feedback-submit"
                                  disabled={fbLoading || fbRating === 0 || !fbText.trim()}
                                >
                                  {fbLoading ? "Sending..." : "Send to Author"}
                                </button>
                                <button
                                  type="button"
                                  className="lib-feedback-cancel"
                                  onClick={closeFeedback}
                                  disabled={fbLoading}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
