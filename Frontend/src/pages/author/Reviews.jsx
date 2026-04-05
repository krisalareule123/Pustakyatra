import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

const Stars = ({ rating }) => (
  <span style={{ color: "#f59e0b", fontSize: 14, letterSpacing: 1 }}>
    {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
  </span>
);

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })
  : "—";

export default function AuthorReviews() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authorToken");

  const [data, setData] = useState({ reviews: [], stats: { totalReviews: 0, avgRating: 0, ratedBooks: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/authors/reviews`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const { totalReviews, avgRating, ratedBooks } = data.stats;

  const filtered = filter === "all"
    ? data.reviews
    : data.reviews.filter(r => r.rating === parseInt(filter));

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: data.reviews.filter(r => r.rating === star).length,
    pct: totalReviews > 0
      ? Math.round((data.reviews.filter(r => r.rating === star).length / totalReviews) * 100)
      : 0
  }));

  if (loading) return (
    <div className="dashboard-workspace">
      <p style={{ color: "#888", padding: 32 }}>Loading reviews...</p>
    </div>
  );

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Reader Reviews</h1>
          <div className="dashboard-date">Ratings and feedback from readers on your books</div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-label">Average Rating</div>
          <div className="stat-value">{avgRating > 0 ? avgRating : "—"}</div>
          {avgRating > 0 && <Stars rating={avgRating} />}
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Reviews</div>
          <div className="stat-value">{totalReviews}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Books Reviewed</div>
          <div className="stat-value">{ratedBooks}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">5-Star Reviews</div>
          <div className="stat-value">{data.reviews.filter(r => r.rating === 5).length}</div>
        </div>
      </div>

      {totalReviews === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white",
          borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
          <p style={{ fontSize: 17, fontWeight: 600, color: "#1a2912", margin: "0 0 6px" }}>No reviews yet</p>
          <p style={{ color: "#888", margin: 0 }}>Reviews from readers will appear here once your books are published.</p>
        </div>
      ) : (
        <div className="dashboard-section">
          <div className="section-header" style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <h2 className="section-title">All Reviews</h2>

            {/* Rating distribution */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 200 }}>
              {dist.map(d => (
                <div key={d.star} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 14, color: "#f59e0b", fontWeight: 700 }}>{d.star}★</span>
                  <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${d.pct}%`, height: "100%", background: "#f59e0b", borderRadius: 3 }} />
                  </div>
                  <span style={{ width: 24, color: "#888", textAlign: "right" }}>{d.count}</span>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["all", "5", "4", "3", "2", "1"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "5px 12px", borderRadius: 20, border: "1px solid",
                  fontSize: 12, cursor: "pointer", fontWeight: 500,
                  background: filter === f ? "#3b5723" : "white",
                  color: filter === f ? "white" : "#555",
                  borderColor: filter === f ? "#3b5723" : "#ddd"
                }}>
                  {f === "all" ? "All" : `${f}★`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            {filtered.length === 0 ? (
              <p style={{ color: "#888", padding: "16px 0" }}>No reviews for this rating.</p>
            ) : filtered.map(review => (
              <div key={review.review_id} style={{
                background: "white", borderRadius: 10, padding: "18px 20px",
                boxShadow: "0 1px 5px rgba(0,0,0,0.06)", borderLeft: "3px solid #f59e0b"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", background: "#3b5723",
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, flexShrink: 0
                    }}>
                      {(review.reader_name || "R").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2912" }}>
                        {review.reader_name || "Anonymous Reader"}
                      </div>
                      <div style={{ fontSize: 12, color: "#aaa" }}>{fmtDate(review.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Stars rating={review.rating} />
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{review.book_title}</div>
                  </div>
                </div>
                {review.comment && (
                  <p style={{ margin: 0, fontSize: 14, color: "#444", lineHeight: 1.6,
                    paddingTop: 10, borderTop: "1px solid #f5f5f5" }}>
                    "{review.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
