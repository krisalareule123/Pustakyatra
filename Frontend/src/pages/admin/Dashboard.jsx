const STATS = [
  { label: "Total Users",    value: "—", icon: "👥", bg: "#e8f0fe", color: "#1a56db" },
  { label: "Total Authors",  value: "—", icon: "✍️", bg: "#e6f4ea", color: "#1e6b35" },
  { label: "Total Books",    value: "—", icon: "📚", bg: "#fff8e1", color: "#b45309" },
  { label: "Published",      value: "—", icon: "✅", bg: "#e6f4ea", color: "#1e6b35" },
  { label: "Draft Books",    value: "—", icon: "📝", bg: "#f0f0f0", color: "#555" },
  { label: "Total Orders",   value: "—", icon: "🛒", bg: "#fde8e8", color: "#b91c1c" },
  { label: "Total Revenue",  value: "Rs. —", icon: "💰", bg: "#e6f4ea", color: "#1e6b35" },
  { label: "Reviews",        value: "—", icon: "⭐", bg: "#fff8e1", color: "#b45309" },
];

const RECENT_USERS = [
  { name: "Krisala Reule",  email: "krisalareule@gmail.com",  joined: "Apr 5, 2026" },
  { name: "Krishav Reule",  email: "krishavreule@gmail.com",  joined: "Apr 4, 2026" },
];

const RECENT_AUTHORS = [
  { name: "Subin Bhattarai",       email: "krisalareule@gmail.com",              books: 3, joined: "Mar 29, 2026" },
  { name: "Laxmi Prasad Devkota",  email: "np03cs4s240056@heraldcollege.edu.np", books: 1, joined: "Mar 28, 2026" },
];

const RECENT_PAYMENTS = [
  { reader: "Krisala Reule", book: "Summer Love",  type: "Rent",     amount: "Rs. 175", status: "paid",   date: "Apr 5, 2026" },
  { reader: "Krishav Reule", book: "Muna Madan",   type: "Buy",      amount: "Rs. 280", status: "paid",   date: "Apr 4, 2026" },
  { reader: "Krisala Reule", book: "Ijoriya",       type: "Buy",      amount: "Rs. 1000", status: "paid", date: "Apr 3, 2026" },
];

const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function AdminDashboard() {
  return (
    <>
      {/* Stats */}
      <div className="admin-stats">
        {STATS.map(s => (
          <div key={s.label} className="admin-stat-card">
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value">{s.value}</div>
            </div>
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="admin-grid-2">
        {/* Recent Users */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Recent User Registrations</h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            {RECENT_USERS.map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px", borderBottom: i < RECENT_USERS.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{initials(u.name)}</div>
                  <div>
                    <div className="admin-user-name">{u.name}</div>
                    <div className="admin-user-sub">{u.email}</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{u.joined}</span>
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
            {RECENT_AUTHORS.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px", borderBottom: i < RECENT_AUTHORS.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                <div className="admin-user-cell">
                  <div className="admin-user-avatar" style={{ background: "linear-gradient(135deg,#2d4a1a,#3b5723)" }}>
                    {initials(a.name)}
                  </div>
                  <div>
                    <div className="admin-user-name">{a.name}</div>
                    <div className="admin-user-sub">{a.books} books uploaded</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{a.joined}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Payments</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reader</th><th>Book</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_PAYMENTS.map((p, i) => (
                <tr key={i}>
                  <td>{p.reader}</td>
                  <td>{p.book}</td>
                  <td><span className={`badge ${p.type === "Buy" ? "badge-blue" : "badge-yellow"}`}>{p.type}</span></td>
                  <td style={{ fontWeight: 700 }}>{p.amount}</td>
                  <td><span className="badge badge-green">{p.status}</span></td>
                  <td style={{ color: "#888" }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
