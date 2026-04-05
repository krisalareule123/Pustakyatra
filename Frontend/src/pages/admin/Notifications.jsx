import { useState } from "react";

const TYPE_CONFIG = {
  purchase:   { icon: "💳", color: "#1e6b35", bg: "#e6f4ea", title: "Book Purchased"     },
  rent:       { icon: "📖", color: "#1a56db", bg: "#e8f0fe", title: "Book Rented"        },
  review_new: { icon: "⭐", color: "#b45309", bg: "#fff8e1", title: "New Review"         },
  review_ok:  { icon: "✅", color: "#1e6b35", bg: "#e6f4ea", title: "Review Approved"    },
  review_hid: { icon: "🚫", color: "#555",    bg: "#f0f0f0", title: "Review Hidden"      },
  book_new:   { icon: "📚", color: "#7c3aed", bg: "#f3e8ff", title: "New Book Uploaded"  },
  book_upd:   { icon: "✏️", color: "#0891b2", bg: "#e0f2fe", title: "Book Updated"       },
  user_new:   { icon: "👤", color: "#1a56db", bg: "#e8f0fe", title: "New User Registered"},
  author_new: { icon: "✍️", color: "#1e6b35", bg: "#e6f4ea", title: "New Author Joined"  },
};

const INITIAL = [
  { id: 1,  type: "purchase",   desc: "Krishav Reule purchased 'Muna Madan'",                          time: "Apr 5, 2026 · 10:42 AM", read: false },
  { id: 2,  type: "rent",       desc: "Krisala Reule rented 'Summer Love' for 16 days",                time: "Apr 5, 2026 · 09:18 AM", read: false },
  { id: 3,  type: "review_new", desc: "Krisala Reule submitted a 5★ review on 'Summer Love'",          time: "Apr 5, 2026 · 08:55 AM", read: false },
  { id: 4,  type: "book_new",   desc: "New book 'Ijoriya' uploaded by Subin Bhattarai",                time: "Apr 4, 2026 · 03:30 PM", read: false },
  { id: 5,  type: "purchase",   desc: "Krisala Reule purchased 'Ijoriya'",                             time: "Apr 4, 2026 · 02:10 PM", read: true  },
  { id: 6,  type: "author_new", desc: "New author registered: Laxmi Prasad Devkota",                   time: "Apr 4, 2026 · 11:00 AM", read: true  },
  { id: 7,  type: "review_ok",  desc: "Review by Krishav Reule on 'Muna Madan' approved",              time: "Apr 4, 2026 · 10:30 AM", read: true  },
  { id: 8,  type: "rent",       desc: "Krishav Reule rented 'Muna Madan' for 15 days",                 time: "Apr 3, 2026 · 06:45 PM", read: true  },
  { id: 9,  type: "book_upd",   desc: "Book 'Summer Love' updated by Subin Bhattarai",                 time: "Apr 3, 2026 · 04:20 PM", read: true  },
  { id: 10, type: "user_new",   desc: "New reader registered: Test Reader",                            time: "Apr 3, 2026 · 01:15 PM", read: true  },
  { id: 11, type: "review_hid", desc: "Review by Test Reader on 'Ijoriya' hidden by admin",            time: "Apr 3, 2026 · 12:00 PM", read: true  },
  { id: 12, type: "book_new",   desc: "New book 'Muna Madan' uploaded by Laxmi Prasad Devkota",        time: "Apr 2, 2026 · 09:00 AM", read: true  },
];

const FILTERS = [
  { key: "all",      label: "All" },
  { key: "purchase", label: "Payments" },
  { key: "review",   label: "Reviews" },
  { key: "book",     label: "Books" },
  { key: "user",     label: "Users" },
];

export default function AdminNotifications() {
  const [notifs, setNotifs] = useState(INITIAL);
  const [filter, setFilter] = useState("all");

  const unread = notifs.filter(n => !n.read).length;

  const markAll  = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const markOne  = (id) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss  = (id) => setNotifs(p => p.filter(n => n.id !== id));

  const filtered = notifs.filter(n => {
    if (filter === "all")     return true;
    if (filter === "review")  return n.type.startsWith("review");
    if (filter === "book")    return n.type.startsWith("book");
    if (filter === "user")    return n.type === "user_new" || n.type === "author_new";
    return n.type === filter;
  });

  return (
    <>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#888" }}>
            {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
          </span>
          {unread > 0 && (
            <span className="badge badge-red">{unread} unread</span>
          )}
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

      {/* Notification list */}
      <div className="admin-card" style={{ marginBottom: 0 }}>
        {filtered.length === 0 && (
          <p style={{ padding: "32px 24px", color: "#aaa", textAlign: "center", fontSize: 14 }}>
            No notifications in this category.
          </p>
        )}

        {filtered.map((n, idx) => {
          const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.user_new;
          return (
            <div
              key={n.id}
              onClick={() => !n.read && markOne(n.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "16px 22px",
                borderBottom: idx < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                background: n.read ? "white" : "#f7faf5",
                cursor: n.read ? "default" : "pointer",
                transition: "background 0.15s",
              }}
            >
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
                <div style={{
                  fontSize: 13, fontWeight: n.read ? 600 : 700,
                  color: "#1a2912", marginBottom: 3,
                }}>
                  {cfg.title}
                </div>
                <div style={{
                  fontSize: 12, color: n.read ? "#888" : "#555",
                  lineHeight: 1.5, whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {n.desc}
                </div>
              </div>

              {/* Right side: time + unread dot + dismiss */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end",
                gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#bbb", whiteSpace: "nowrap" }}>{n.time}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {!n.read && (
                    <span style={{ width: 7, height: 7, borderRadius: "50%",
                      background: "#3b5723", display: "block" }} />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: "#ccc", fontSize: 14, padding: "0 2px", lineHeight: 1 }}
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
