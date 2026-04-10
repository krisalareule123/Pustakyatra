import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/admin";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";
const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [viewUser, setViewUser] = useState(null);

  const load = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    setLoading(true);
    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) { navigate("/admin/login"); return null; }
        return r.json();
      })
      .then(d => { if (d?.success) setUsers(d.users); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggle = async (id) => {
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API}/users/${id}/toggle`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: res.isBlocked } : u));
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all"
      || (filter === "active"   &&  u.isActive)
      || (filter === "inactive" && !u.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { label: "Total Users",  value: users.length,                          icon: "👥", bg: "#e8f0fe", color: "#1a56db" },
          { label: "Active",       value: users.filter(u =>  u.isActive).length, icon: "🟢", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Inactive",     value: users.filter(u => !u.isActive).length, icon: "⚫", bg: "#f0f0f0", color: "#555"    },
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
        <div className="admin-card-header">
          <h3 className="admin-card-title">User Management</h3>
          <div className="admin-toolbar">
            <input className="admin-search" placeholder="Search users..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {[["all","All"],["active","Active"],["inactive","Inactive"]].map(([f, label]) => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}>{label}</button>
            ))}
            <button className="admin-btn admin-btn-secondary" onClick={load}>↻ Refresh</button>
          </div>
        </div>

        {loading ? (
          <p style={{ padding: "24px 20px", color: "#888", fontSize: 13 }}>Loading users...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>User</th><th>Email</th><th>Joined</th><th>Orders</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "#aaa", padding: 32 }}>No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar" style={{ position: "relative" }}>
                          {initials(u.name)}
                          <span style={{ position: "absolute", bottom: 0, right: 0,
                            width: 9, height: 9, borderRadius: "50%",
                            background: u.isActive ? "#22c55e" : "#d1d5db",
                            border: "2px solid white" }} />
                        </div>
                        <div>
                          <div className="admin-user-name">{u.name}</div>
                          <div className="admin-user-sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#555" }}>{u.email}</td>
                    <td style={{ color: "#888" }}>{fmtDate(u.joined)}</td>
                    <td>{u.orders}</td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-green" : "badge-gray"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="admin-btn admin-btn-secondary"
                          onClick={() => setViewUser(u)}>View</button>
                        <button
                          className={`admin-btn ${u.isBlocked ? "admin-btn-primary" : "admin-btn-danger"}`}
                          onClick={() => toggle(u.id)}>
                          {u.isBlocked ? "Activate" : "Deactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View modal */}
      {viewUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setViewUser(null)}>
          <div style={{ background: "white", borderRadius: 16, width: 420,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>

            {/* Header banner */}
            <div style={{ background: "linear-gradient(135deg,#2d4419,#3b5723)", padding: "28px 28px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)",
                  color: "white", fontSize: 20, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {initials(viewUser.name)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 3 }}>
                    {viewUser.name}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{viewUser.email}</div>
                </div>
                <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                  background: viewUser.isActive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.15)",
                  color: viewUser.isActive ? "#86efac" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${viewUser.isActive ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.2)"}` }}>
                  {viewUser.isActive ? "● Active" : "● Inactive"}
                </span>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "20px 28px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa",
                textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 }}>
                Account Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  { icon: "📅", label: "Member Since", value: fmtDate(viewUser.joined) },
                  { icon: "📋", label: "Total Orders",  value: viewUser.orders || 0 },
                  { icon: "📧", label: "Email",         value: viewUser.email },
                  { icon: "🔒", label: "Account",       value: viewUser.isBlocked ? "Deactivated" : "Normal" },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f8f9fa", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 4 }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2912",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className={`admin-btn ${viewUser.isBlocked ? "admin-btn-primary" : "admin-btn-danger"}`}
                  style={{ flex: 1, padding: "10px" }}
                  onClick={() => { toggle(viewUser.id); setViewUser(null); }}>
                  {viewUser.isBlocked ? "Activate Account" : "Deactivate Account"}
                </button>
                <button onClick={() => setViewUser(null)}
                  style={{ flex: 1, padding: "10px", background: "#f0f0f0", color: "#555",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
