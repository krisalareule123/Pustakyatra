import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/admin";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

const Stars = ({ n }) => (
  <span style={{ fontSize: 14, letterSpacing: 1 }}>
    {"★".repeat(n)}<span style={{ color: "#ddd" }}>{"★".repeat(5 - n)}</span>
  </span>
);

const STATUS_STYLE = {
  visible: { background: "#e6f4ea", color: "#1e6b35", label: "Visible" },
  hidden:  { background: "#f0f0f0", color: "#666",    label: "Hidden"  },
  pending: { background: "#fff8e1", color: "#b45309", label: "Pending" },
};

export default function AdminReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  const token = () => localStorage.getItem("adminToken");

  useEffect(() => {
    const t = token();
    if (!t) { navigate("/admin/login"); return; }
    fetch(`${API}/reviews`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (r.status === 401) { navigate("/admin/login"); return null; } return r.json(); })
      .then(d => { if (d?.success) setReviews(d.reviews); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const updateStatus = async (id, status) => {
    await fetch(`${API}/reviews/${id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setReviews(prev => prev.map(r => r.review_id === id ? { ...r, status } : r));
    window.dispatchEvent(new Event("adminBadgeRefresh"));
  };

  const remove = async (id) => {
    await fetch(`${API}/reviews/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token()}` }
    });
    setReviews(prev => prev.filter(r => r.review_id !== id));
    window.dispatchEvent(new Event("adminBadgeRefresh"));
  };

  const counts = {
    all:     reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    visible: reviews.filter(r => r.status === "visible").length,
    hidden:  reviews.filter(r => r.status === "hidden").length,
  };

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total Reviews", value: counts.all,     icon: "⭐", bg: "#fff8e1", color: "#b45309" },
          { label: "Pending",       value: counts.pending, icon: "⏳", bg: "#fff8e1", color: "#b45309" },
          { label: "Visible",       value: counts.visible, icon: "✅", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Hidden",        value: counts.hidden,  icon: "🚫", bg: "#f0f0f0", color: "#555"    },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div><div className="admin-stat-label">{s.label}</div><div className="admin-stat-value">{s.value}</div></div>
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Review Moderation</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#888" }}>
              Approve reviews to make them visible to authors and readers.
            </p>
          </div>
          <div className="admin-toolbar">
            {[["all","All"],["pending","Pending"],["visible","Visible"],["hidden","Hidden"]].map(([f, label]) => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}>
                {label} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ padding: "32px 24px", color: "#aaa", textAlign: "center" }}>Loading reviews...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: "32px 24px", color: "#aaa", textAlign: "center", fontSize: 14 }}>
            No reviews in this category.
          </p>
        ) : filtered.map((r, idx) => {
          const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
          return (
            <div key={r.review_id} style={{
              padding: "20px 24px",
              borderBottom: idx < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
              borderLeft: `3px solid ${r.status === "visible" ? "#3b5723" : r.status === "pending" ? "#f59e0b" : "#e0e0e0"}`,
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#f59e0b" }}><Stars n={r.rating} /></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>{r.rating}.0</span>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: st.background, color: st.color }}>{st.label}</span>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{fmtDate(r.created_at)}</span>
              </div>

              {/* Reader + Book */}
              <div style={{ marginBottom: 10, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: "#1a2912" }}>{r.reader_name}</span>
                <span style={{ color: "#aaa", margin: "0 8px" }}>reviewed</span>
                <span style={{ fontWeight: 700, color: "#3b5723" }}>{r.book_title}</span>
              </div>

              {/* Comment */}
              {r.comment && (
                <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#444",
                  lineHeight: 1.65, fontStyle: "italic" }}>
                  "{r.comment}"
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                {r.status === "pending" && (
                  <button className="admin-btn admin-btn-primary"
                    onClick={() => updateStatus(r.review_id, "visible")}>✓ Approve</button>
                )}
                {r.status === "visible" && (
                  <button className="admin-btn admin-btn-secondary"
                    onClick={() => updateStatus(r.review_id, "hidden")}>Hide</button>
                )}
                {r.status === "hidden" && (
                  <button className="admin-btn admin-btn-secondary"
                    onClick={() => updateStatus(r.review_id, "visible")}>Unhide</button>
                )}
                <button className="admin-btn admin-btn-danger"
                  onClick={() => remove(r.review_id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
