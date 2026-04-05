import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

export default function Sales() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authorToken");
  const [stats, setStats] = useState({ totalEarnings: 0, published: 0, totalBooks: 0 });
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/authors/stats`, { headers: h }).then(r => r.json()),
      fetch(`${API}/authors/books`, { headers: h }).then(r => r.json()),
    ]).then(([s, b]) => {
      if (s.success) setStats(s.stats);
      if (b.success) setBooks(b.books);
    }).catch(console.error).finally(() => setLoading(false));
  }, [token, navigate]);

  const totalSales = books.reduce((s, b) => s + (parseInt(b.sales) || 0), 0);

  if (loading) return (
    <div className="dashboard-workspace">
      <p style={{ color: "#888", padding: 32 }}>Loading earnings...</p>
    </div>
  );

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Sales & Earnings</h1>
          <div className="dashboard-date">Track your book sales and royalty earnings</div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-label">Total Earnings</div>
          <div className="stat-value">Rs. {(stats.totalEarnings || 0).toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value">{totalSales}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Published Books</div>
          <div className="stat-value">{stats.published || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Books</div>
          <div className="stat-value">{stats.totalBooks || 0}</div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Earnings by Book</h2>
        </div>
        {books.length === 0 ? (
          <p style={{ color: "#888", padding: "16px 0" }}>No books uploaded yet.</p>
        ) : (
          <div className="performance-table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Status</th>
                  <th>Sales</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <tr key={b.book_id}>
                    <td><div className="book-title-cell">{b.title}</div></td>
                    <td><span className={`status-indicator ${b.status}`}>{b.status}</span></td>
                    <td><div className="metric-value">{b.sales}</div></td>
                    <td><div className="metric-value">Rs. {parseFloat(b.earnings || 0).toLocaleString()}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="royalty-info" style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
        <div className="info-box" style={{ flex: 1, background: "white", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 5px rgba(0,0,0,0.06)" }}>
          <h3 className="info-title" style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1a2912" }}>Royalty Structure</h3>
          <p className="info-text" style={{ margin: 0, fontSize: 13, color: "#666" }}>You earn 70% royalty on all sales. Pustakyatra retains 30% as platform fee.</p>
        </div>
        <div className="info-box" style={{ flex: 1, background: "white", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 5px rgba(0,0,0,0.06)" }}>
          <h3 className="info-title" style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#1a2912" }}>Payout Schedule</h3>
          <p className="info-text" style={{ margin: 0, fontSize: 13, color: "#666" }}>Earnings are paid out monthly on the 5th of each month to your registered account.</p>
        </div>
      </div>
    </div>
  );
}
