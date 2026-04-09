import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/authors";

const TYPE_CONFIG = {
  purchase: { icon: "💰", title: "Book Purchased",  color: "#1e6b35", bg: "#e6f4ea" },
  rent:     { icon: "📖", title: "Book Rented",     color: "#1a56db", bg: "#e8f0fe" },
  review:   { icon: "⭐", title: "New Review",      color: "#b45309", bg: "#fff8e1" },
  favorite: { icon: "❤️", title: "Book Favorited",  color: "#b91c1c", bg: "#fde8e8" },
};

const fmtTime = (d) => d
  ? new Date(d).toLocaleString("en-NP", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    })
  : "";

export default function AuthorNotifications() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authorToken");

  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setNotifs(d.notifications); else setError(d.message); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const markOne = async (id) => {
    await fetch(`${API}/notifications/${id}/read`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }
    });
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
  };

  const unread = notifs.filter(n => !n.is_read).length;

  const filtered = filter === "all" ? notifs : notifs.filter(n => n.type === filter);

  if (loading) return (
    <div className="dashboard-workspace">
      <p style={{ color: "#888", padding: 32 }}>Loading notifications...</p>
    </div>
  );

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Notifications
            {unread > 0 && (
              <span style={{
                marginLeft: 10, background: "#e53e3e", color: "white",
                fontSize: 11, fontWeight: 700, padding: "2px 8px",
                borderRadius: 20, verticalAlign: "middle"
              }}>{unread} new</span>
            )}
          </h1>
          <div className="dashboard-date">Activity on your books</div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fde8e8", borderRadius: 8,
          color: "#b91c1c", marginBottom: 20 }}>{error}</div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all","All"], ["purchase","Purchases"], ["rent","Rentals"], ["review","Reviews"]].map(([key, label]) => (
          <button key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: filter === key ? "#3b5723" : "white",
              color: filter === key ? "white" : "#555",
              borderColor: filter === key ? "#3b5723" : "#ddd",
              transition: "all 0.15s"
            }}>
            {label}
            {key === "all" ? ` (${notifs.length})` : ` (${notifs.filter(n => n.type === key).length})`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={{
        background: "white", borderRadius: 12,
        boxShadow: "0 1px 5px rgba(0,0,0,0.06)", overflow: "hidden"
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#aaa" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <p style={{ fontSize: 14, margin: 0 }}>
              {notifs.length === 0
                ? "No notifications yet. They will appear when readers interact with your books."
                : "No notifications in this category."}
            </p>
          </div>
        ) : filtered.map((n, idx) => {
          const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", title: n.type, color: "#555", bg: "#f0f0f0" };
          return (
            <div key={n.notification_id}
              onClick={() => !n.is_read && markOne(n.notification_id)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "15px 20px",
                borderBottom: idx < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                background: n.is_read ? "white" : "#f7faf5",
                cursor: n.is_read ? "default" : "pointer",
                transition: "background 0.15s",
              }}>

              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: cfg.bg, color: cfg.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, marginTop: 1,
              }}>
                {cfg.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: n.is_read ? 600 : 700,
                  color: "#1a2912", marginBottom: 2 }}>
                  {cfg.title}
                </div>
                <div style={{ fontSize: 12, color: n.is_read ? "#888" : "#555", lineHeight: 1.5 }}>
                  {n.message}
                </div>
              </div>

              {/* Right */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end",
                gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap" }}>
                  {fmtTime(n.created_at)}
                </span>
                {!n.is_read && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%",
                    background: "#3b5723", display: "block" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
