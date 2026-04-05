import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../pages/Pages.css";

const API = "http://localhost:5001/api";

const fmtTime = (d) => {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NOTIF_ICONS = { purchase: "💰", rent: "📖", review: "⭐", favorite: "❤️" };

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const authorData = (() => {
    try { return JSON.parse(localStorage.getItem("authorData") || "{}"); } catch { return {}; }
  })();

  const token = localStorage.getItem("authorToken");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/authors/stats`, { headers }).then(r => r.json()),
      fetch(`${API}/authors/notifications`, { headers }).then(r => r.json()),
      fetch(`${API}/authors/books`, { headers }).then(r => r.json()),
    ]).then(([statsRes, notifRes, booksRes]) => {
      if (statsRes.success) setStats(statsRes.stats);
      if (notifRes.success) setNotifications(notifRes.notifications.slice(0, 5));
      if (booksRes.success) setBooks(booksRes.books.slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const markRead = async (id) => {
    await fetch(`${API}/authors/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: 1 } : n));
  };

  if (loading) return (
    <div className="dashboard-workspace">
      <div style={{ padding: 40, color: "#888" }}>Loading dashboard...</div>
    </div>
  );

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <div className="dashboard-date">
            Welcome back, {authorData.fullName || "Author"} ·{" "}
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      {/* Real stats */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-label">Total Books</div>
          <div className="stat-value">{stats?.totalBooks ?? 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Published</div>
          <div className="stat-value">{stats?.published ?? 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Drafts</div>
          <div className="stat-value">{stats?.drafts ?? 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Earnings</div>
          <div className="stat-value">Rs. {(stats?.totalEarnings ?? 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Recent books */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Books</h2>
        </div>
        {books.length === 0 ? (
          <p style={{ color: "#888", padding: "16px 0" }}>You have not uploaded any books yet.</p>
        ) : (
          <div className="performance-table-container">
            <table className="performance-table">
              <thead>
                <tr><th>Title</th><th>Status</th><th>Sales</th><th>Earnings</th></tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b.book_id}>
                    <td><div className="book-title-cell">{b.title}</div></td>
                    <td>
                      <span className={`status-indicator ${b.status}`}>{b.status}</span>
                    </td>
                    <td><div className="metric-value">{b.sales}</div></td>
                    <td><div className="metric-value">Rs. {parseFloat(b.earnings).toLocaleString()}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            Notifications
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="notif-badge">{notifications.filter(n => !n.is_read).length}</span>
            )}
          </h2>
        </div>
        {notifications.length === 0 ? (
          <p style={{ color: "#888", padding: "16px 0" }}>No notifications yet.</p>
        ) : (
          <div className="activity-feed">
            {notifications.map(n => {
              const icon = NOTIF_ICONS[n.type] || "🔔";
              return (
                <div
                  key={n.notification_id}
                  className={`activity-row${n.is_read ? "" : " notif-unread"}`}
                  onClick={() => !n.is_read && markRead(n.notification_id)}
                  style={{ cursor: n.is_read ? "default" : "pointer" }}
                >
                  <div className="activity-info" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <div>
                      <span className="activity-action" style={{ fontWeight: n.is_read ? 400 : 600 }}>
                        {n.message}
                      </span>
                      {n.reader_name && (
                        <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>
                          — {n.reader_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <div className="activity-time">{fmtTime(n.created_at)}</div>
                    {!n.is_read && (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b5723", display: "block" }} />
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
