import { useState, useEffect } from "react";

const API = "http://localhost:5001/api/admin";

const TYPE_CONFIG = {
  purchase:     { icon: "💳", color: "#1e6b35", bg: "#e6f4ea", title: "Book Purchased"      },
  rent:         { icon: "📖", color: "#1a56db", bg: "#e8f0fe", title: "Book Rented"         },
  review_new:   { icon: "⭐", color: "#b45309", bg: "#fff8e1", title: "New Review"          },
  review_ok:    { icon: "✅", color: "#1e6b35", bg: "#e6f4ea", title: "Review Approved"     },
  review_hid:   { icon: "🚫", color: "#555",    bg: "#f0f0f0", title: "Review Hidden"       },
  book_new:     { icon: "📚", color: "#7c3aed", bg: "#f3e8ff", title: "New Book Uploaded"   },
  book_publish: { icon: "🚀", color: "#0891b2", bg: "#e0f2fe", title: "Book Published"      },
  user_new:     { icon: "👤", color: "#1a56db", bg: "#e8f0fe", title: "New User Registered" },
  author_new:   { icon: "✍️", color: "#1e6b35", bg: "#e6f4ea", title: "New Author Joined"   },
};

const FILTERS = [
  { key: "all",      label: "All"      },
  { key: "purchase", label: "Payments" },
  { key: "review",   label: "Reviews"  },
  { key: "book",     label: "Books"    },
  { key: "user",     label: "Users"    },
];

const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleString("en-NP", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

export default function AdminNotifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const token = localStorage.getItem("adminToken");

  const load = () => {
    if (!token) return;
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setNotifs(d.notifications); else setError(d.message || "Failed to load"); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]);

  const markOne = async (id) => {
    await fetch(`${API}/notifications/${id}/read`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }
    });
    setNotifs(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
  };

  const markAll = async () => {
    await fetch(`${API}/notifications/read-all`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }
    });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: 1 })));
  };

  const dismiss = (id) => setNotifs(prev => prev.filter(n => n.notification_id !== id));

  const filtered = notifs.filter(n => {
    if (filter === "all")     return true;
    if (filter === "review")  return n.type.startsWith("review");
    if (filter === "book")    return n.type.startsWith("book");
    if (filter === "user")    return n.type === "user_new" || n.type === "author_new";
    return n.type === filter;
  });

  const unread = notifs.filter(n => !n.is_read).length;

  if (loading) return <p style={{ padding: 32, color: "#888" }}>Loading notifications...</p>;
  if (error)   return <div style={{ padding: 20, background: "#fde8e8", borderRadius: 8, color: "#b91c1c" }}>{error}</div>;

  return (
    <>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#888" }}>
            {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
          </span>
          {unread > 0 && <span className="badge badge-red">{unread} unread</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map(f => (
            <button key={f.key} className={`admin-filter-btn ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
          {unread > 0 && (
            <button className="admin-btn admin-btn-secondary" onClick={markAll}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="admin-card" style={{ marginBottom: 0 }}>
        {filtered.length === 0 && (
          <p style={{ padding: "32px 24px", color: "#aaa", textAlign: "center", fontSize: 14 }}>
            {notifs.length === 0 ? "No notifications yet. They will appear as activity happens." : "No notifications in this category."}
          </p>
        )}

        {filtered.map((n, idx) => {
          const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", color: "#555", bg: "#f0f0f0", title: n.type };
          return (
            <div key={n.notification_id}
              onClick={() => !n.is_read && markOne(n.notification_id)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "15px 22px",
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
                <div style={{ fontSize: 13, fontWeight: n.is_read ? 600 : 700, color: "#1a2912", marginBottom: 2 }}>
                  {cfg.title}
                </div>
                <div style={{ fontSize: 12, color: n.is_read ? "#888" : "#555", lineHeight: 1.5 }}>
                  {n.message}
                </div>
              </div>

              {/* Right: time + dot + dismiss */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end",
                gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap" }}>{fmtTime(n.created_at)}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {!n.is_read && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%",
                      background: "#3b5723", display: "block" }} />
                  )}
                  <button onClick={(e) => { e.stopPropagation(); dismiss(n.notification_id); }}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: "#ccc", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                    title="Dismiss">×</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
