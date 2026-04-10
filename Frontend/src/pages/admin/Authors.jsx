import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/admin";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";
const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

export default function AdminAuthors() {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetch(`${API}/authors`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { navigate("/admin/login"); return null; } return r.json(); })
      .then(d => { if (d?.success) setAuthors(d.authors); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = authors.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                        a.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all"
      || (filter === "active"   &&  a.isActive)
      || (filter === "inactive" && !a.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total Authors", value: authors.length,                              icon: "✍️", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Active",        value: authors.filter(a =>  a.isActive).length,     icon: "🟢", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Inactive",      value: authors.filter(a => !a.isActive).length,     icon: "⚫", bg: "#f0f0f0", color: "#555"    },
          { label: "Total Books",   value: authors.reduce((s,a) => s + a.books, 0),     icon: "📚", bg: "#fff8e1", color: "#b45309" },
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
          <h3 className="admin-card-title">Author Management</h3>
          <div className="admin-toolbar">
            <input className="admin-search" placeholder="Search authors..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {[["all","All"],["active","Active"],["inactive","Inactive"]].map(([f, label]) => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ padding: "24px 20px", color: "#888", fontSize: 13 }}>Loading authors...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Author</th><th>Email</th><th>Books</th><th>Published</th><th>Drafts</th><th>Joined</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "#aaa", padding: 32 }}>No authors found</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar"
                          style={{ background: "linear-gradient(135deg,#2d4a1a,#3b5723)", position: "relative" }}>
                          {initials(a.name)}
                          <span style={{ position: "absolute", bottom: 0, right: 0,
                            width: 9, height: 9, borderRadius: "50%",
                            background: a.isActive ? "#22c55e" : "#d1d5db",
                            border: "2px solid white" }} />
                        </div>
                        <div>
                          <div className="admin-user-name">{a.name}</div>
                          <div className="admin-user-sub">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#555" }}>{a.email}</td>
                    <td style={{ fontWeight: 700 }}>{a.books}</td>
                    <td><span className="badge badge-green">{a.published}</span></td>
                    <td><span className="badge badge-yellow">{a.drafts}</span></td>
                    <td style={{ color: "#888" }}>{fmtDate(a.joined)}</td>
                    <td>
                      <span className={`badge ${a.isActive ? "badge-green" : "badge-gray"}`}>
                        {a.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
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
