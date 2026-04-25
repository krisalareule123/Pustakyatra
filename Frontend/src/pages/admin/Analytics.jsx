import { useState, useEffect } from "react";

const API = "http://localhost:5001/api/admin";

// ── SVG line/area chart ───────────────────────────────────────────────────────
function LineChart({ data, color = "#3b5723", height = 110 }) {
  if (!data || !data.length) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: 12 }}>No data</div>;
  const max = Math.max(...data.map(d => d.val), 1);
  const W = 100, H = 100;
  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * W,
    y: H - (d.val / max) * H * 0.85 - 5,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L 0 ${H} Z`;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
        <defs>
          <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0,25,50,75,100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f0f0f0" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={areaPath} fill={`url(#g${color.replace("#","")})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} vectorEffect="non-scaling-stroke" />)}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: 10, color: "#aaa", flex: 1, textAlign: "center" }}>{d.label}</span>)}
      </div>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ buy, rent }) {
  const total = buy + rent;
  const buyPct = total > 0 ? (buy / total) * 100 : 50;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  const buyDash = (buyPct / 100) * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg viewBox="0 0 100 100" style={{ width: 110, height: 110, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b5723" strokeWidth="14"
          strokeDasharray={`${buyDash} ${circ - buyDash}`} strokeDashoffset={circ / 4} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth="14"
          strokeDasharray={`${circ - buyDash} ${buyDash}`} strokeDashoffset={circ / 4 - buyDash} strokeLinecap="round" />
        <text x="50" y="47" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a2912">{Math.round(buyPct)}%</text>
        <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#888">Buy</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[{ label: "Buy", count: buy, color: "#3b5723", pct: Math.round(buyPct) },
          { label: "Rent", count: rent, color: "#f59e0b", pct: 100 - Math.round(buyPct) }].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{item.count} orders · {item.pct}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rating bars ───────────────────────────────────────────────────────────────
function RatingDist({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(d => (
        <div key={d.star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, fontSize: 12, color: "#f59e0b", fontWeight: 700, flexShrink: 0 }}>{d.star}★</span>
          <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(d.count / max) * 100}%`, height: "100%", background: "#f59e0b", borderRadius: 4 }} />
          </div>
          <span style={{ width: 20, fontSize: 12, color: "#888", textAlign: "right", flexShrink: 0 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, sub, children }) {
  return (
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div style={{ padding: "16px 20px 10px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2912", marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "#aaa" }}>{sub}</div>}
      </div>
      <div style={{ padding: "0 20px 18px" }}>{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/analytics`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.analytics); else setError(d.message); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p style={{ padding: 32, color: "#888" }}>Loading analytics...</p>;
  if (error)   return <div style={{ padding: 20, background: "#fde8e8", borderRadius: 8, color: "#b91c1c" }}>{error}</div>;
  if (!data)   return null;

  const SUMMARY = [
    { label: "Total Users",          value: data.totalUsers,   icon: "👥", bg: "#e8f0fe", color: "#1a56db" },
    { label: "Total Authors",        value: data.totalAuthors, icon: "✍️", bg: "#e6f4ea", color: "#1e6b35" },
    { label: "Total Books",          value: data.totalBooks,   icon: "📚", bg: "#fff8e1", color: "#b45309" },
    { label: "Total Orders",         value: data.totalOrders,  icon: "🛒", bg: "#fde8e8", color: "#b91c1c" },
    { label: "Total Revenue",        value: `Rs. ${parseFloat(data.totalRevenue || 0).toLocaleString()}`,        icon: "💰", bg: "#e6f4ea", color: "#1e6b35" },
    { label: "Platform Commission (15%)", value: `Rs. ${parseFloat(data.platformCommission || 0).toLocaleString()}`, icon: "🏦", bg: "#e8f0fe", color: "#1a56db" },
    { label: "Author Payouts (85%)", value: `Rs. ${parseFloat(data.authorPayouts || 0).toLocaleString()}`,      icon: "✍️", bg: "#fff8e1", color: "#b45309" },
    { label: "Total Reviews",        value: data.totalReviews, icon: "⭐", bg: "#fff8e1", color: "#b45309" },
  ];

  const ratingDist = [
    { star: 5, count: data.r5 },
    { star: 4, count: data.r4 },
    { star: 3, count: data.r3 },
    { star: 2, count: data.r2 },
    { star: 1, count: data.r1 },
  ];

  // Simple trend lines using real totals as single data points
  const revenueTrend = [{ label: "Total", val: data.totalRevenue }];
  const ordersTrend  = [{ label: "Paid",  val: data.totalOrders  }];

  return (
    <>
      {/* Summary cards */}
      <div className="admin-stats" style={{ marginBottom: 24 }}>
        {SUMMARY.map(s => (
          <div key={s.label} className="admin-stat-card">
            <div>
              <div className="admin-stat-label">{s.label}</div>
              <div className="admin-stat-value">{s.value}</div>
            </div>
            <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Buy vs Rent + Rating distribution */}
      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <ChartCard title="Buy vs Rent Distribution" sub="Order type breakdown from paid orders">
          <DonutChart buy={data.buyOrders} rent={data.rentOrders} />
        </ChartCard>
        <ChartCard title="Rating Distribution" sub="Reader review ratings breakdown">
          <RatingDist data={ratingDist} />
        </ChartCard>
      </div>

      {/* Row 2: Books status + Platform summary */}
      <div className="admin-grid-2">
        <ChartCard title="Books Status" sub="Published vs Draft books">
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
            {[
              { label: "Published", count: data.publishedBooks, color: "#3b5723", bg: "#e6f4ea" },
              { label: "Draft",     count: data.draftBooks,     color: "#b45309", bg: "#fff8e1" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: item.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0 }}>
                  {item.label === "Published" ? "✅" : "📝"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>{item.label}</div>
                  <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, marginTop: 4, overflow: "hidden" }}>
                    <div style={{
                      width: `${data.totalBooks > 0 ? (item.count / data.totalBooks) * 100 : 0}%`,
                      height: "100%", background: item.color, borderRadius: 3
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: item.color, flexShrink: 0 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Platform Summary" sub="Key metrics at a glance">
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              ["Total Users",    data.totalUsers,   "👥"],
              ["Total Authors",  data.totalAuthors, "✍️"],
              ["Total Books",    data.totalBooks,   "📚"],
              ["Paid Orders",    data.totalOrders,  "🛒"],
              ["Total Revenue",  `Rs. ${data.totalRevenue.toLocaleString()}`, "💰"],
              ["Total Reviews",  data.totalReviews, "⭐"],
            ].map(([label, val, icon]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "9px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{icon}</span>
                <span style={{ flex: 1, color: "#555" }}>{label}</span>
                <span style={{ fontWeight: 700, color: "#1a2912" }}>{val}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </>
  );
}
