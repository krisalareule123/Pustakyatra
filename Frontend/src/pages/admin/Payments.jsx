import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/admin";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments,     setPayments]     = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login"); return; }
    fetch(`${API}/payments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { navigate("/admin/login"); return null; } return r.json(); })
      .then(d => {
        if (d?.success) { setPayments(d.payments); setTotalRevenue(d.totalRevenue || 0); }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const filtered = payments.filter(p =>
    !search ||
    p.reader?.toLowerCase().includes(search.toLowerCase()) ||
    p.book?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { label: "Total Revenue",  value: `Rs. ${parseFloat(totalRevenue).toLocaleString()}`, icon: "💰", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Transactions",   value: payments.length,                                    icon: "📊", bg: "#e8f0fe", color: "#1a56db" },
          { label: "Unique Readers", value: new Set(payments.map(p => p.reader)).size,          icon: "👥", bg: "#fff8e1", color: "#b45309" },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div><div className="admin-stat-label">{s.label}</div><div className="admin-stat-value">{s.value}</div></div>
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Payment History</h3>
          <div className="admin-toolbar">
            <input className="admin-search" placeholder="Search reader or book..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <p style={{ padding: "24px 20px", color: "#888", fontSize: 13 }}>Loading payments...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Order #</th><th>Reader</th><th>Book</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", color: "#aaa", padding: 32 }}>No payments found</td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={`${p.id}-${i}`}>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.reader}</td>
                    <td>{p.book}</td>
                    <td>
                      <span className={`badge ${p.type === "buy" ? "badge-blue" : "badge-yellow"}`}>
                        {p.type === "buy" ? "Buy" : "Rent"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#1a2912" }}>Rs. {p.amount.toLocaleString()}</td>
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
