import { useState } from "react";

// ── Mock data ────────────────────────────────────────────────────────────────
const SUMMARY = [
  { label: "Total Users",   value: 3,      icon: "👥", bg: "#e8f0fe", color: "#1a56db" },
  { label: "Total Authors", value: 3,      icon: "✍️", bg: "#e6f4ea", color: "#1e6b35" },
  { label: "Total Books",   value: 4,      icon: "📚", bg: "#fff8e1", color: "#b45309" },
  { label: "Total Orders",  value: 12,     icon: "🛒", bg: "#fde8e8", color: "#b91c1c" },
  { label: "Total Revenue", value: "Rs. 8,450", icon: "💰", bg: "#e6f4ea", color: "#1e6b35" },
  { label: "Total Reviews", value: 3,      icon: "⭐", bg: "#fff8e1", color: "#b45309" },
];

const REVENUE_7D = [
  { day: "Mon", val: 0    },
  { day: "Tue", val: 1000 },
  { day: "Wed", val: 175  },
  { day: "Thu", val: 280  },
  { day: "Fri", val: 1000 },
  { day: "Sat", val: 2000 },
  { day: "Sun", val: 3995 },
];

const ORDERS_7D = [
  { day: "Mon", val: 0 },
  { day: "Tue", val: 1 },
  { day: "Wed", val: 1 },
  { day: "Thu", val: 1 },
  { day: "Fri", val: 2 },
  { day: "Sat", val: 3 },
  { day: "Sun", val: 4 },
];

const USER_REG = [
  { month: "Jan", val: 0 },
  { month: "Feb", val: 0 },
  { month: "Mar", val: 2 },
  { month: "Apr", val: 3 },
];

const BOOKS_UPLOAD = [
  { month: "Jan", val: 0 },
  { month: "Feb", val: 0 },
  { month: "Mar", val: 3 },
  { month: "Apr", val: 4 },
];

const BUY_RENT = { buy: 7, rent: 5 };   // orders breakdown
const RATING_DIST = [
  { star: 5, count: 1 },
  { star: 4, count: 1 },
  { star: 3, count: 1 },
  { star: 2, count: 0 },
  { star: 1, count: 0 },
];

// ── Reusable SVG line/area chart ─────────────────────────────────────────────
function LineChart({ data, color = "#3b5723", height = 120, fill = true }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.val), 1);
  const W = 100, H = 100;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (d.val / max) * H * 0.85 - 5,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L 0 ${H} Z`;
  const xLabels = data.map(d => d.day || d.month);

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y}
            stroke="#f0f0f0" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {fill && <path d={areaPath} fill={`url(#grad-${color.replace("#","")})`} />}
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color}
            vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {/* X-axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {xLabels.map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: "#aaa", flex: 1, textAlign: "center" }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, color = "#3b5723" }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, padding: "0 4px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", borderRadius: "4px 4px 0 0",
            background: color, opacity: 0.85,
            height: `${(d.val / max) * 80}px`,
            minHeight: d.val > 0 ? 4 : 0,
            transition: "height 0.3s"
          }} />
          <span style={{ fontSize: 10, color: "#aaa" }}>{d.month || d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ buy, rent }) {
  const total = buy + rent;
  const buyPct = total > 0 ? (buy / total) * 100 : 50;
  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;
  const buyDash = (buyPct / 100) * circ;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg viewBox="0 0 100 100" style={{ width: 120, height: 120, flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="14" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b5723" strokeWidth="14"
          strokeDasharray={`${buyDash} ${circ - buyDash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth="14"
          strokeDasharray={`${circ - buyDash} ${buyDash}`}
          strokeDashoffset={circ / 4 - buyDash}
          strokeLinecap="round" />
        <text x="50" y="47" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1a2912">{Math.round(buyPct)}%</text>
        <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#888">Buy</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { label: "Buy",  count: buy,  color: "#3b5723", pct: Math.round(buyPct) },
          { label: "Rent", count: rent, color: "#f59e0b", pct: 100 - Math.round(buyPct) },
        ].map(item => (
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

// ── Rating distribution bars ─────────────────────────────────────────────────
function RatingDist({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map(d => (
        <div key={d.star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 28, fontSize: 12, color: "#f59e0b", fontWeight: 700, flexShrink: 0 }}>
            {d.star}★
          </span>
          <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${(d.count / max) * 100}%`, height: "100%",
              background: "#f59e0b", borderRadius: 4, transition: "width 0.3s"
            }} />
          </div>
          <span style={{ width: 20, fontSize: 12, color: "#888", textAlign: "right", flexShrink: 0 }}>
            {d.count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Chart card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, sub, children }) {
  return (
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <div style={{ padding: "18px 22px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2912", marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "#aaa" }}>{sub}</div>}
      </div>
      <div style={{ padding: "0 22px 20px" }}>{children}</div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const [period, setPeriod] = useState("7d");

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

      {/* Period toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["7d","Last 7 Days"],["30d","Last 30 Days"]].map(([k, label]) => (
          <button key={k} className={`admin-filter-btn ${period === k ? "active" : ""}`}
            onClick={() => setPeriod(k)}>
            {label}
          </button>
        ))}
      </div>

      {/* Row 1: Revenue + Orders */}
      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <ChartCard title="Revenue Trend" sub="Total earnings over time (Rs.)">
          <LineChart data={REVENUE_7D} color="#3b5723" height={130} />
        </ChartCard>
        <ChartCard title="Orders Trend" sub="Number of orders placed over time">
          <LineChart data={ORDERS_7D} color="#1a56db" height={130} />
        </ChartCard>
      </div>

      {/* Row 2: User registrations + Books uploaded */}
      <div className="admin-grid-2" style={{ marginBottom: 20 }}>
        <ChartCard title="User Registrations" sub="New reader accounts per month">
          <BarChart data={USER_REG} color="#1a56db" />
        </ChartCard>
        <ChartCard title="Books Uploaded" sub="Books added by authors per month">
          <BarChart data={BOOKS_UPLOAD} color="#3b5723" />
        </ChartCard>
      </div>

      {/* Row 3: Buy vs Rent + Rating distribution */}
      <div className="admin-grid-2">
        <ChartCard title="Buy vs Rent Distribution" sub="Order type breakdown">
          <DonutChart buy={BUY_RENT.buy} rent={BUY_RENT.rent} />
        </ChartCard>
        <ChartCard title="Rating Distribution" sub="Reader review ratings breakdown">
          <RatingDist data={RATING_DIST} />
        </ChartCard>
      </div>
    </>
  );
}
