import { useState, useEffect } from "react";

const API = "http://localhost:5001/api/admin";

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" })
  : "—";

const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

const STAT_META = [
  { key: "totalUsers",    label: "Total Users",    icon: "👥", bg: "#e8f0fe", color: "#1a56db" },
  { key: "totalAuthors",  label: "Total Authors",  icon: "✍️", bg: "#e6f4ea", color: "#1e6b35" },
  { key: "totalBooks",    label: "Total Books",    icon: "📚", bg: "#fff8e1", color: "#b45309" },
  { key: "publishedBooks",label: "Published",      icon: "✅", bg: "#e6f4ea", color: "#1e6b35" },
  { key: "draftBooks",    label: "Draft Books",    icon: "📝", bg: "#f0f0f0", color: "#555"    },
  { key: "totalOrders",   label: "Total Orders",   icon: "🛒", bg: "#fde8e8", color: "#b91c1c" },
  { key: "totalRevenue",  label: "Total Revenue",  icon: "💰", bg: "#e6f4ea", color: "#1e6b35", prefix: "Rs. " },
  { key: "totalReviews",  label: "Reviews",        icon: "⭐", bg: "#fff8e1", color: "#b45309" },
];

export default function AdminDashboard() {
  const [stats,    setStats]    = useState({});
  const [users,    setUsers]    = useState([]);
  const [authors,  setAuthors]  = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/stats`,  { headers: h }).then(r => r.json()),
      fetch(`${API}/recent`, { headers: h }).then(r => r.json()),
    ])
      .then(([statsRes, recentRes]) => {
        if (statsRes.success)  setStats(statsRes.stats);
        if (recentRes.success) {
          setUsers(recentRes.recentUsers    || []);
          setAuthors(recentRes.recentAuthors  || []);
          setPayments(recentRes.recentPayments || []);
        }
      })
      .catch(e => setError("Could not load dashboard data: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: "#888", padding: 32 }}>Loading dashboard...</p>;
  if (error)   return <div style={{ padding: 20, background: "#fde8e8", borderRadius: 8, color: "#b91c1c" }}>{error}</div>;

  return (
    <>
      {/* Stats */}
      <div className="admin-stats">
        {STAT_META.map(s => {
          const raw = stats[s.key] ?? "—";
          const val = raw === "—" ? "—" : (s.prefix ? `${s.prefix}${parseFloat(raw).toLocaleString()}` : raw);
          return (
            <div key={s.key} className="admin-stat-card">
              <div>
                <div className="admin-stat-label">{s.label}</div>
                <div className="admin-stat-value">{val}</div>
              </div>
              <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            </div>
          );
        })}
      </div>

      <div className="admin-grid-2">
        {/* Recent Users */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent User Registrations</h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            {users.length === 0 ? (
              <p style={{ padding: "16px 20px", color: "#aaa", fontSize: 13 }}>No users yet.</p>
            ) : users.map((u, i) => (
              <div key={u.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px",
                borderBottom: i < users.length - 1 ? "1px solid #f5f5f5" : "none"
              }}>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{initials(u.name)}</div>
                  <div>
                    <div className="admin-user-name">{u.name}</div>
                    <div className="admin-user-sub">{u.email}</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{fmtDate(u.joined)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Authors */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent Author Registrations</h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            {authors.length === 0 ? (
              <p style={{ padding: "16px 20px", color: "#aaa", fontSize: 13 }}>No authors yet.</p>
            ) : authors.map((a, i) => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px",
                borderBottom: i < authors.length - 1 ? "1px solid #f5f5f5" : "none"
              }}>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar" style={{ background: "linear-gradient(135deg,#2d4a1a,#3b5723)" }}>
                    {initials(a.name)}
                  </div>
                  <div>
                    <div className="admin-user-name">{a.name}</div>
                    <div className="admin-user-sub">{a.books} book{a.books !== 1 ? "s" : ""} uploaded</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{fmtDate(a.joined)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments — paid only */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Payments</h3>
          <span style={{ fontSize: 12, color: "#888" }}>Successful paid orders only</span>
        </div>
        {payments.length === 0 ? (
          <p style={{ padding: "16px 20px", color: "#aaa", fontSize: 13 }}>No paid orders yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reader</th><th>Book</th><th>Type</th>
                  <th>Amount</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.reader}</td>
                    <td>{p.book || "—"}</td>
                    <td>
                      <span className={`badge ${p.type === "buy" ? "badge-blue" : "badge-yellow"}`}>
                        {p.type === "buy" ? "Buy" : "Rent"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>Rs. {p.amount.toLocaleString()}</td>
                    <td><span className="badge badge-green">paid</span></td>
                    <td style={{ color: "#888" }}>{fmtDate(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
