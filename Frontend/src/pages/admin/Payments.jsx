import { useState } from "react";

const PAYMENTS = [
  { id: "PK25T177", reader: "Krisala Reule", book: "Summer Love",  type: "Rent", amount: 175,  method: "eSewa", status: "paid",    date: "Apr 5, 2026" },
  { id: "PK26T177", reader: "Krishav Reule", book: "Muna Madan",   type: "Buy",  amount: 280,  method: "eSewa", status: "paid",    date: "Apr 4, 2026" },
  { id: "PK27T177", reader: "Krisala Reule", book: "Ijoriya",       type: "Buy",  amount: 1000, method: "eSewa", status: "paid",    date: "Apr 3, 2026" },
  { id: "PK28T177", reader: "Test Reader",   book: "Summer Love",  type: "Rent", amount: 175,  method: "eSewa", status: "failed",  date: "Apr 2, 2026" },
  { id: "PK29T177", reader: "Krisala Reule", book: "Test Data",    type: "Buy",  amount: 1250, method: "eSewa", status: "pending", date: "Apr 1, 2026" },
];

export default function AdminPayments() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? PAYMENTS : PAYMENTS.filter(p => p.status === filter);
  const totalRevenue = PAYMENTS.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <div className="admin-stats" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {[
          { label: "Total Revenue",      value: `Rs. ${totalRevenue.toLocaleString()}`, icon: "💰", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Total Transactions", value: PAYMENTS.length,                        icon: "📊", bg: "#e8f0fe", color: "#1a56db" },
          { label: "Paid",               value: PAYMENTS.filter(p => p.status === "paid").length,    icon: "✅", bg: "#e6f4ea", color: "#1e6b35" },
          { label: "Failed / Pending",   value: PAYMENTS.filter(p => p.status !== "paid").length,   icon: "⚠️", bg: "#fde8e8", color: "#b91c1c" },
        ].map(s => (
          <div key={s.label} className="admin-stat-card">
            <div><div className="admin-stat-label">{s.label}</div><div className="admin-stat-value">{s.value}</div></div>
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">All Payments</h3>
          <div className="admin-toolbar">
            {["all","paid","failed","pending"].map(f => (
              <button key={f} className={`admin-filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Transaction ID</th><th>Reader</th><th>Book</th><th>Type</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>{p.id}</td>
                  <td style={{ fontWeight: 600 }}>{p.reader}</td>
                  <td>{p.book}</td>
                  <td><span className={`badge ${p.type === "Buy" ? "badge-blue" : "badge-yellow"}`}>{p.type}</span></td>
                  <td style={{ fontWeight: 700, color: "#1a2912" }}>Rs. {p.amount.toLocaleString()}</td>
                  <td><span className="badge badge-gray">{p.method}</span></td>
                  <td><span className={`badge ${p.status === "paid" ? "badge-green" : p.status === "failed" ? "badge-red" : "badge-yellow"}`}>{p.status}</span></td>
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
