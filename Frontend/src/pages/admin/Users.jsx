import { useState } from "react";

const USERS = [
  { id: "RDR-0001", name: "Krisala Reule",  email: "krisalareule@gmail.com",  joined: "Apr 5, 2026",  status: "active",   orders: 4 },
  { id: "RDR-0002", name: "Krishav Reule",  email: "krishavreule@gmail.com",  joined: "Apr 4, 2026",  status: "active",   orders: 2 },
  { id: "RDR-0003", name: "Test Reader",    email: "test@example.com",        joined: "Mar 20, 2026", status: "inactive", orders: 0 },
];

const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="admin-stat-card">
          <div><div className="admin-stat-label">Total Users</div><div className="admin-stat-value">{USERS.length}</div></div>
          <div className="admin-stat-icon" style={{ background: "#e8f0fe", color: "#1a56db" }}>👥</div>
        </div>
        <div className="admin-stat-card">
          <div><div className="admin-stat-label">Active</div><div className="admin-stat-value">{USERS.filter(u => u.status === "active").length}</div></div>
          <div className="admin-stat-icon" style={{ background: "#e6f4ea", color: "#1e6b35" }}>✅</div>
        </div>
        <div className="admin-stat-card">
          <div><div className="admin-stat-label">Inactive</div><div className="admin-stat-value">{USERS.filter(u => u.status === "inactive").length}</div></div>
          <div className="admin-stat-icon" style={{ background: "#f0f0f0", color: "#555" }}>⏸</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">User Management</h3>
          <div className="admin-toolbar">
            <input className="admin-search" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            {["all","active","inactive"].map(f => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Joined</th><th>Orders</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">{initials(u.name)}</div>
                      <div>
                        <div className="admin-user-name">{u.name}</div>
                        <div className="admin-user-sub">ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "#555" }}>{u.email}</td>
                  <td style={{ color: "#888" }}>{u.joined}</td>
                  <td>{u.orders}</td>
                  <td><span className={`badge ${u.status === "active" ? "badge-green" : "badge-gray"}`}>{u.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn admin-btn-secondary">View</button>
                      <button className="admin-btn admin-btn-danger">{u.status === "active" ? "Deactivate" : "Activate"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
