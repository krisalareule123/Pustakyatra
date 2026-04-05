import { useState } from "react";

const NOTIFS = [
  { id: 1, type: "purchase", text: "Krisala Reule purchased 'Summer Love'",  time: "2 hours ago",  read: false },
  { id: 2, type: "review",   text: "Krishav Reule reviewed 'Muna Madan' (4★)", time: "4 hours ago", read: false },
  { id: 3, type: "rent",     text: "Krisala Reule rented 'Ijoriya'",          time: "6 hours ago",  read: true  },
  { id: 4, type: "upload",   text: "Subin Bhattarai uploaded a new book",     time: "1 day ago",    read: true  },
  { id: 5, type: "register", text: "New reader registered: Test Reader",      time: "2 days ago",   read: true  },
];

const TYPE_ICON  = { purchase: "💰", review: "⭐", rent: "📖", upload: "📤", register: "👤" };
const TYPE_COLOR = { purchase: "badge-green", review: "badge-yellow", rent: "badge-blue", upload: "badge-gray", register: "badge-blue" };

export default function AdminNotifications() {
  const [notifs, setNotifs] = useState(NOTIFS);

  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markOne = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const unread = notifs.filter(n => !n.read).length;

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            System Notifications
            {unread > 0 && <span className="badge badge-red" style={{ marginLeft: 10 }}>{unread} new</span>}
          </h3>
          {unread > 0 && (
            <button className="admin-btn admin-btn-secondary" onClick={markAll}>Mark all as read</button>
          )}
        </div>

        <div style={{ padding: "8px 0" }}>
          {notifs.map(n => (
            <div key={n.id}
              onClick={() => markOne(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 22px", borderBottom: "1px solid #f5f5f5",
                background: n.read ? "white" : "#f7faf5",
                cursor: n.read ? "default" : "pointer",
                transition: "background 0.15s"
              }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "#f0f0f0", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 18, flexShrink: 0
              }}>
                {TYPE_ICON[n.type] || "🔔"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 700, color: "#1a2912" }}>{n.text}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{n.time}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span className={`badge ${TYPE_COLOR[n.type] || "badge-gray"}`}>{n.type}</span>
                {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b5723", display: "block" }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
