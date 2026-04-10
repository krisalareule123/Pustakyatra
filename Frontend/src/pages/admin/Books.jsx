import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/admin";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function AdminBooks() {
  const navigate = useNavigate();
  const [books,    setBooks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [search,   setSearch]   = useState("");
  const [viewBook, setViewBook] = useState(null);

  const token = () => localStorage.getItem("adminToken");

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    const t = token();
    if (!t) { navigate("/admin/login"); return; }
    setLoading(true);
    fetch(`${API}/books`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (r.status === 401) { navigate("/admin/login"); return null; } return r.json(); })
      .then(d => { if (d?.success) setBooks(d.books); })
      .finally(() => setLoading(false));
  };

  const updateStatus = async (id, action) => {
    await fetch(`${API}/books/${id}/${action}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token()}` }
    });
    setBooks(prev => prev.map(b => b.id === id
      ? { ...b, status: action === "publish" ? "published" : "draft" }
      : b
    ));
    if (viewBook?.id === id) setViewBook(v => ({ ...v, status: action === "publish" ? "published" : "draft" }));
  };

  const filtered = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                        b.author.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total Books", value: books.length,                                      icon: "📚", bg: "#e8f0fe", color: "#1a56db" },
          { label: "Published",   value: books.filter(b => b.status === "published").length, icon: "✅", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Drafts",      value: books.filter(b => b.status === "draft").length,     icon: "📝", bg: "#fff8e1", color: "#b45309" },
          { label: "Authors",     value: new Set(books.map(b => b.author)).size,             icon: "✍️", bg: "#f0f0f0", color: "#555"    },
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
            <input className="admin-search" placeholder="Search books or authors..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {[["all","All"],["published","Published"],["draft","Draft"]].map(([f, label]) => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}>{label}</button>
            ))}
            <button className="admin-btn admin-btn-secondary" onClick={load}>↻ Refresh</button>
          </div>
        </div>

        {loading ? (
          <p style={{ padding: "24px 20px", color: "#888", fontSize: 13 }}>Loading books...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Title</th><th>Author</th><th>Category</th><th>Buy Price</th><th>Rent Price</th><th>Status</th><th>Uploaded</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", color: "#aaa", padding: 32 }}>No books found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: "#1a2912" }}>{b.title}</td>
                    <td style={{ color: "#555" }}>{b.author}</td>
                    <td><span className="badge badge-blue">{b.category || "—"}</span></td>
                    <td>Rs. {b.buyPrice}</td>
                    <td>Rs. {b.rentPrice}</td>
                    <td><span className={`badge ${b.status === "published" ? "badge-green" : "badge-yellow"}`}>{b.status}</span></td>
                    <td style={{ color: "#888" }}>{fmtDate(b.uploaded)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="admin-btn admin-btn-secondary"
                          onClick={() => setViewBook(b)}>View</button>
                        {b.status === "draft" ? (
                          <button className="admin-btn admin-btn-primary"
                            onClick={() => updateStatus(b.id, "publish")}>Publish</button>
                        ) : (
                          <button className="admin-btn admin-btn-danger"
                            onClick={() => updateStatus(b.id, "hide")}>Hide</button>
                        )}
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
      {viewBook && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setViewBook(null)}>
          <div style={{ background: "white", borderRadius: 16, width: 440,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#2d4419,#3b5723)", padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10,
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  📚
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "white", marginBottom: 3 }}>{viewBook.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>by {viewBook.author}</div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: viewBook.status === "published" ? "rgba(34,197,94,0.2)" : "rgba(255,193,7,0.2)",
                  color: viewBook.status === "published" ? "#86efac" : "#fcd34d",
                  border: `1px solid ${viewBook.status === "published" ? "rgba(34,197,94,0.4)" : "rgba(255,193,7,0.4)"}` }}>
                  {viewBook.status}
                </span>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "20px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { icon: "🏷️", label: "Category",   value: viewBook.category || "—" },
                  { icon: "📅", label: "Uploaded",   value: fmtDate(viewBook.uploaded) },
                  { icon: "💰", label: "Buy Price",  value: `Rs. ${viewBook.buyPrice}` },
                  { icon: "📖", label: "Rent Price", value: `Rs. ${viewBook.rentPrice}` },
                ].map(item => (
                  <div key={item.label} style={{ background: "#f8f9fa", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 4 }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {viewBook.status === "draft" ? (
                  <button className="admin-btn admin-btn-primary" style={{ flex: 1, padding: "10px" }}
                    onClick={() => { updateStatus(viewBook.id, "publish"); setViewBook(null); }}>
                    ✅ Publish Book
                  </button>
                ) : (
                  <button className="admin-btn admin-btn-danger" style={{ flex: 1, padding: "10px" }}
                    onClick={() => { updateStatus(viewBook.id, "hide"); setViewBook(null); }}>
                    Hide Book
                  </button>
                )}
                <button onClick={() => setViewBook(null)}
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
