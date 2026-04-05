import { useState } from "react";

const AUTHORS = [
  { id: "AUTH-0006", name: "Subin Bhattarai",       email: "krisalareule@gmail.com",              books: 3, published: 2, drafts: 1, joined: "Mar 29, 2026", status: "active" },
  { id: "AUTH-0005", name: "Laxmi Prasad Devkota",  email: "np03cs4s240056@heraldcollege.edu.np", books: 1, published: 1, drafts: 0, joined: "Mar 28, 2026", status: "active" },
  { id: "AUTH-0007", name: "Buddhisagar",            email: "krishavreule@gmail.com",              books: 0, published: 0, drafts: 0, joined: "Mar 27, 2026", status: "active" },
];

const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function AdminAuthors() {
  const [search, setSearch] = useState("");

  const filtered = AUTHORS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="admin-stat-card">
          <div><div className="admin-stat-label">Total Authors</div><div className="admin-stat-value">{AUTHORS.length}</div></div>
          <div className="admin-stat-icon" style={{ background: "#e6f4ea", color: "#1e6b35" }}>✍️</div>
        </div>
        <div className="admin-stat-card">
          <div><div className="admin-stat-label">Total Books</div><div className="admin-stat-value">{AUTHORS.reduce((s,a) => s + a.books, 0)}</div></div>
          <div className="admin-stat-icon" style={{ background: "#fff8e1", color: "#b45309" }}>📚</div>
        </div>
        <div className="admin-stat-card">
          <div><div className="admin-stat-label">Published</div><div className="admin-stat-value">{AUTHORS.reduce((s,a) => s + a.published, 0)}</div></div>
          <div className="admin-stat-icon" style={{ background: "#e8f0fe", color: "#1a56db" }}>✅</div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Author Management</h3>
          <div className="admin-toolbar">
            <input className="admin-search" placeholder="Search authors..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Author</th><th>Email</th><th>Books</th><th>Published</th><th>Drafts</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar" style={{ background: "linear-gradient(135deg,#2d4a1a,#3b5723)" }}>{initials(a.name)}</div>
                      <div>
                        <div className="admin-user-name">{a.name}</div>
                        <div className="admin-user-sub">{a.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "#555" }}>{a.email}</td>
                  <td style={{ fontWeight: 700 }}>{a.books}</td>
                  <td><span className="badge badge-green">{a.published}</span></td>
                  <td><span className="badge badge-yellow">{a.drafts}</span></td>
                  <td style={{ color: "#888" }}>{a.joined}</td>
                  <td><span className={`badge ${a.status === "active" ? "badge-green" : "badge-gray"}`}>{a.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn admin-btn-secondary">View</button>
                      <button className="admin-btn admin-btn-danger">Deactivate</button>
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
