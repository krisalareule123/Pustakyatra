import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./MyLibrary.css";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : null;

const daysLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
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

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }

    orderAPI.getLibrary(token)
      .then((res) => { if (res.success) setBooks(res.library); })
      .catch((err) => setError(err.message || "Failed to load library"))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleReadNow = async (bookId) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
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
              const remaining = isRent ? daysLeft(book.rentExpiresAt) : null;
              const expired = remaining !== null && remaining <= 0;

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

                    {/* Access status */}
                    {!isRent && (
                      <p className="lib-access-line lib-permanent">✓ Permanent access</p>
                    )}
                    {isRent && !expired && remaining !== null && (
                      <p className={"lib-access-line " + (remaining <= 3 ? "lib-expiring" : "lib-active-rent")}>
                        {remaining === 0 ? "Expires today" : `${remaining} day${remaining !== 1 ? "s" : ""} left`}
                        {book.rentExpiresAt && (
                          <span className="lib-expiry-date"> · {fmtDate(book.rentExpiresAt)}</span>
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
