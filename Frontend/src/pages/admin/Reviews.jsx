import { useState } from "react";

const REVIEWS = [
  { id: 1, reader: "Krisala Reule", book: "Summer Love",  rating: 5, comment: "A very emotional and meaningful story. Highly recommended.", date: "Apr 5, 2026", status: "visible" },
  { id: 2, reader: "Krishav Reule", book: "Muna Madan",   rating: 4, comment: "Beautiful poetry. Devkota's language is timeless.", date: "Apr 4, 2026", status: "visible" },
  { id: 3, reader: "Test Reader",   book: "Ijoriya",       rating: 3, comment: "Good story but could be longer.", date: "Apr 3, 2026", status: "hidden" },
];

const Stars = ({ n }) => <span style={{ color: "#f59e0b" }}>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;

export default function AdminReviews() {
  const [filter, setFilter] = useState("all");
  const [reviews, setReviews] = useState(REVIEWS);

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  const toggle = (id) => setReviews(prev => prev.map(r =>
    r.id === id ? { ...r, status: r.status === "visible" ? "hidden" : "visible" } : r
  ));

  const remove = (id) => setReviews(prev => prev.filter(r => r.id !== id));

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Review Moderation</h3>
          <div className="admin-toolbar">
            {["all","visible","hidden"].map(f => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? reviews.length : reviews.filter(r => r.status === f).length})
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "8px 0" }}>
          {filtered.length === 0 && (
            <p style={{ padding: "24px", color: "#888", textAlign: "center" }}>No reviews in this category.</p>
          )}
          {filtered.map(r => (
            <div key={r.id} style={{
              padding: "18px 22px", borderBottom: "1px solid #f5f5f5",
              borderLeft: `3px solid ${r.status === "visible" ? "#3b5723" : "#e0e0e0"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Stars n={r.rating} />
                    <span className={`badge ${r.status === "visible" ? "badge-green" : "badge-gray"}`}>{r.status}</span>
                    <span style={{ fontSize: 12, color: "#888" }}>{r.date}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 700 }}>{r.reader}</span>
                    <span style={{ color: "#888", margin: "0 6px" }}>on</span>
                    <span style={{ color: "#3b5723", fontWeight: 600 }}>{r.book}</span>
                  </div>
                </div>
              </div>
              {r.comment && (
                <p style={{ margin: "8px 0 12px", fontSize: 13, color: "#444", lineHeight: 1.6,
                  background: "#fafafa", padding: "10px 14px", borderRadius: 8 }}>
                  "{r.comment}"
                </p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="admin-btn admin-btn-secondary" onClick={() => toggle(r.id)}>
                  {r.status === "visible" ? "Hide" : "Unhide"}
                </button>
                <button className="admin-btn admin-btn-danger" onClick={() => remove(r.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
