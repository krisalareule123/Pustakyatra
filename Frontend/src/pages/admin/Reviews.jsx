import { useState } from "react";

// All reviews start as "pending" — admin must approve before they become visible
const INITIAL_REVIEWS = [
  {
    id: 1,
    reader: "Krisala Reule",
    book: "Summer Love",
    rating: 5,
    comment: "A very emotional and meaningful story. It beautifully shows love, sacrifice, and the reality of life. Highly recommended.",
    date: "Apr 5, 2026",
    status: "pending",   // pending → admin approves → visible
  },
  {
    id: 2,
    reader: "Krishav Reule",
    book: "Muna Madan",
    rating: 4,
    comment: "Beautiful poetry. Devkota's language is timeless and deeply moving.",
    date: "Apr 4, 2026",
    status: "visible",
  },
  {
    id: 3,
    reader: "Test Reader",
    book: "Ijoriya",
    rating: 3,
    comment: "Good story but could be longer. The ending felt rushed.",
    date: "Apr 3, 2026",
    status: "hidden",
  },
];

const Stars = ({ n }) => (
  <span style={{ fontSize: 15, letterSpacing: 1 }}>
    {"★".repeat(n)}<span style={{ color: "#ddd" }}>{"★".repeat(5 - n)}</span>
  </span>
);

const STATUS_STYLE = {
  visible: { background: "#e6f4ea", color: "#1e6b35", label: "Visible" },
  hidden:  { background: "#f0f0f0", color: "#666",    label: "Hidden"  },
  pending: { background: "#fff8e1", color: "#b45309", label: "Pending" },
};

const FILTER_TABS = ["all", "pending", "visible", "hidden"];

export default function AdminReviews() {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [filter, setFilter]   = useState("all");

  const counts = FILTER_TABS.reduce((acc, f) => {
    acc[f] = f === "all" ? reviews.length : reviews.filter(r => r.status === f).length;
    return acc;
  }, {});

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  const approve = (id) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "visible" } : r));
  const hide    = (id) => setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "hidden"  } : r));
  const remove  = (id) => setReviews(prev => prev.filter(r => r.id !== id));

  return (
    <>
      {/* Summary cards */}
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 24 }}>
        {[
          { label: "Total Reviews", value: counts.all,     icon: "⭐", bg: "#fff8e1", color: "#b45309" },
          { label: "Pending",       value: counts.pending, icon: "⏳", bg: "#fff8e1", color: "#b45309" },
          { label: "Visible",       value: counts.visible, icon: "✅", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Hidden",        value: counts.hidden,  icon: "🚫", bg: "#f0f0f0", color: "#555"    },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value">{s.value}</div>
            </div>
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        {/* Header + filter tabs */}
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Review Moderation</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#888" }}>
              Reviews must be approved before they appear to authors and readers.
            </p>
          </div>
          <div className="admin-toolbar">
            {FILTER_TABS.map(f => (
              <button
                key={f}
                className={`admin-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Review list */}
        <div>
          {filtered.length === 0 && (
            <p style={{ padding: "32px 24px", color: "#aaa", textAlign: "center", fontSize: 14 }}>
              No reviews in this category.
            </p>
          )}

          {filtered.map((r, idx) => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.pending;
            return (
              <div
                key={r.id}
                style={{
                  padding: "22px 24px",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                  borderLeft: `3px solid ${r.status === "visible" ? "#3b5723" : r.status === "pending" ? "#f59e0b" : "#e0e0e0"}`,
                }}
              >
                {/* Row 1: stars + badge + date */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#f59e0b" }}><Stars n={r.rating} /></span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>{r.rating}.0</span>
                    <span style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: st.background, color: st.color
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "#aaa" }}>{r.date}</span>
                </div>

                {/* Row 2: reader + book */}
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: "#1a2912" }}>{r.reader}</span>
                  <span style={{ color: "#aaa", margin: "0 8px" }}>reviewed</span>
                  <span style={{ fontWeight: 700, color: "#3b5723" }}>{r.book}</span>
                </div>

                {/* Row 3: comment */}
                {r.comment && (
                  <div style={{
                    background: "#fafafa", border: "1px solid #f0f0f0",
                    borderRadius: 8, padding: "12px 16px", marginBottom: 14,
                    fontSize: 13, color: "#444", lineHeight: 1.65,
                    fontStyle: "italic"
                  }}>
                    "{r.comment}"
                  </div>
                )}

                {/* Row 4: action buttons */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {r.status === "pending" && (
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={() => approve(r.id)}
                    >
                      ✓ Approve
                    </button>
                  )}
                  {r.status === "visible" && (
                    <button
                      className="admin-btn admin-btn-secondary"
                      onClick={() => hide(r.id)}
                    >
                      Hide
                    </button>
                  )}
                  {r.status === "hidden" && (
                    <button
                      className="admin-btn admin-btn-secondary"
                      onClick={() => approve(r.id)}
                    >
                      Unhide
                    </button>
                  )}
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => remove(r.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
