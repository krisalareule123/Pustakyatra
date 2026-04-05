import { useState } from "react";

const BOOKS = [
  { id: 1, title: "Summer Love",  author: "Subin Bhattarai",      category: "Fiction",   buyPrice: 500, rentPrice: 175, status: "published", uploaded: "Mar 29, 2026" },
  { id: 2, title: "Ijoriya",      author: "Subin Bhattarai",      category: "Fiction",   buyPrice: 1000, rentPrice: 500, status: "published", uploaded: "Mar 29, 2026" },
  { id: 3, title: "Test Data",    author: "Subin Bhattarai",      category: "Self-Help", buyPrice: 1250, rentPrice: 1000, status: "published", uploaded: "Mar 28, 2026" },
  { id: 4, title: "Muna Madan",   author: "Laxmi Prasad Devkota", category: "Poetry",    buyPrice: 1000, rentPrice: 500, status: "draft",     uploaded: "Apr 4, 2026" },
];

export default function AdminBooks() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = BOOKS.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                        b.author.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total Books",  value: BOOKS.length,                                    icon: "📚", bg: "#e8f0fe", color: "#1a56db" },
          { label: "Published",    value: BOOKS.filter(b => b.status === "published").length, icon: "✅", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Drafts",       value: BOOKS.filter(b => b.status === "draft").length,    icon: "📝", bg: "#fff8e1", color: "#b45309" },
          { label: "Authors",      value: new Set(BOOKS.map(b => b.author)).size,            icon: "✍️", bg: "#f0f0f0", color: "#555" },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div><div className="admin-stat-label">{s.label}</div><div className="admin-stat-value">{s.value}</div></div>
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Book Management</h3>
          <div className="admin-toolbar">
            <input className="admin-search" placeholder="Search books or authors..." value={search} onChange={e => setSearch(e.target.value)} />
            {["all","published","draft"].map(f => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Author</th><th>Category</th><th>Buy Price</th><th>Rent Price</th><th>Status</th><th>Uploaded</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: "#1a2912" }}>{b.title}</td>
                  <td style={{ color: "#555" }}>{b.author}</td>
                  <td><span className="badge badge-blue">{b.category}</span></td>
                  <td>Rs. {b.buyPrice}</td>
                  <td>Rs. {b.rentPrice}</td>
                  <td><span className={`badge ${b.status === "published" ? "badge-green" : "badge-yellow"}`}>{b.status}</span></td>
                  <td style={{ color: "#888" }}>{b.uploaded}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="admin-btn admin-btn-secondary">View</button>
                      <button className="admin-btn admin-btn-danger">Hide</button>
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
