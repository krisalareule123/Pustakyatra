import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { readerAPI, orderAPI } from "../services/api";
import "./UserDashboard.css";

const NAV = [
  { key: "dashboard",     icon: "▣",  label: "Dashboard"       },
  { key: "details",       icon: "👤", label: "Account Details" },
  { key: "settings",      icon: "⚙️", label: "Settings"        },
  { key: "orders",        icon: "📋", label: "My Orders"       },
  { key: "library",       icon: "📚", label: "My Library"      },
  { key: "payments",      icon: "💳", label: "Payments"        },
  { key: "history",       icon: "🕐", label: "Reading History" },
  { key: "notifications", icon: "🔔", label: "Notifications"   },
];

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#444", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "#e53e3e", marginLeft: 2 }}>*</span>}
    </label>
    {children}
  </div>
);

const inp = {
  width: "100%", padding: "10px 12px", border: "1.5px solid #e0e0e0",
  borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box",
  background: "#fafafa", color: "#1a2912",
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("dashboard");
  const [user,   setUser]   = useState({ fullName: "", email: "", phone: "", address: "", isActive: 1, isOnline: false, profileImage: null });
  const [stats,  setStats]  = useState(null);
  const [profileForm,  setProfileForm]  = useState({ fullName: "", email: "", phone: "", address: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState({ type: "", text: "" });

  // Library & Orders state
  const [orders,       setOrders]       = useState([]);
  const [library,      setLibrary]      = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [libLoaded,    setLibLoaded]    = useState(false);
  const [libFilter,    setLibFilter]    = useState("all");
  const [libSearch,    setLibSearch]    = useState("");
  const [notifs,       setNotifs]       = useState([]);
  const [notifsLoaded, setNotifsLoaded] = useState(false);
  const [showPwForm,   setShowPwForm]   = useState(false);
  const [receipt,      setReceipt]      = useState(null); // order to show in receipt modal
  const [openingBook,  setOpeningBook]  = useState(null);

  const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }

    setLoading(true);
    readerAPI.getProfile(token)
      .then(res => {
        if (res.success) {
          const d = { fullName: res.user.fullName || "", email: res.user.email || "",
                      phone: res.user.phone || "", address: res.user.address || "",
                      isActive: res.user.isActive ?? 1,
                      isOnline: res.user.isOnline ?? false,
                      profileImage: res.user.profileImage || null };
          setUser(d); setProfileForm(d);
          // Sync profileImage to localStorage so navbar updates
          const stored = JSON.parse(localStorage.getItem("userData") || "{}");
          localStorage.setItem("userData", JSON.stringify({ ...stored, profileImage: res.user.profileImage || null }));
          window.dispatchEvent(new Event("userLoggedIn"));
        }
      })
      .catch(() => {
        const stored = localStorage.getItem("userData");
        if (stored) {
          const p = JSON.parse(stored);
          const d = { fullName: p.fullName || "", email: p.email || "", phone: "", address: "" };
          setUser(d); setProfileForm(d);
        } else {
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));

    // Fetch reader stats
    readerAPI.getStats(token)
      .then(res => { if (res.success) setStats(res.stats); })
      .catch(() => {});

    // Pre-load notifications for badge count
    readerAPI.getNotifications(token)
      .then(res => { if (res.success) { setNotifs(res.notifications); setNotifsLoaded(true); } })
      .catch(() => {});
  }, [navigate]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    setLoading(true);
    try {
      const res = await readerAPI.updateProfile(token, profileForm);
      if (res.success) {
        setUser(prev => ({ ...prev, ...profileForm })); // preserve profileImage
        const stored = JSON.parse(localStorage.getItem("userData") || "{}");
        localStorage.setItem("userData", JSON.stringify({ ...stored, fullName: profileForm.fullName, email: profileForm.email }));
        window.dispatchEvent(new Event("userLoggedIn"));
        showMsg("success", "Profile updated successfully.");
      }
    } catch (err) { showMsg("error", err.message || "Failed to update profile"); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMsg("error", "New passwords do not match."); return;
    }
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    setLoading(true);
    try {
      const res = await readerAPI.changePassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.success) {
        showMsg("success", "Password changed successfully.");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) { showMsg("error", err.message || "Failed to change password"); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (token) {
      try {
        await fetch("http://localhost:5001/api/readers/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        });
      } catch (e) {
        console.error("Logout fetch failed:", e);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    window.dispatchEvent(new Event("userLoggedOut"));
    navigate("/login");
  };

  const switchTab = (key) => {
    setActive(key);
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if ((key === "orders" || key === "payments" || key === "history") && !ordersLoaded) {
      orderAPI.getMyOrders(token, "paid")
        .then(res => { if (res.success) setOrders(res.orders); })
        .finally(() => setOrdersLoaded(true));
    }
    if (key === "library" && !libLoaded) {
      orderAPI.getLibrary(token)
        .then(res => { if (res.success) setLibrary(res.library); })
        .finally(() => setLibLoaded(true));
    }
    if (key === "notifications" && !notifsLoaded) {
      readerAPI.getNotifications(token)
        .then(res => { if (res.success) setNotifs(res.notifications); })
        .finally(() => setNotifsLoaded(true));
    }
  };

  const handleReadNow = async (bookId) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    setOpeningBook(bookId);
    try {
      const res = await orderAPI.issueReadToken(token, bookId);
      if (res.success && res.readToken) navigate(`/reader/${res.readToken}`);
    } finally { setOpeningBook(null); }
  };

  const daysLeft = (expiresAt) => {
    if (!expiresAt) return null;
    return Math.floor((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

  const fmtDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-NP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const MsgBox = () => msg.text ? (
    <div style={{
      padding: "10px 14px", borderRadius: 8, marginBottom: 18, fontSize: 13,
      background: msg.type === "success" ? "#d4edda" : "#f8d7da",
      color: msg.type === "success" ? "#155724" : "#721c24",
    }}>{msg.text}</div>
  ) : null;

  return (
    <div className="rd-shell">

      {/* ── Sidebar ── */}
      <aside className="rd-sidebar">
        {/* Brand */}
        <div className="rd-sidebar-brand">
          <div className="rd-brand-dot">P</div>
          <div>
            <div className="rd-brand-name">Pustakyatra</div>
            <div className="rd-brand-sub">My Account</div>
          </div>
        </div>

        {/* Avatar */}
        <div className="rd-avatar-block">
          <div className="rd-avatar" style={{ overflow: "hidden", padding: 0 }}>
            {user.profileImage ? (
              <img src={`http://localhost:5001/${user.profileImage}`} alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : initials(user.fullName)}
          </div>
          <div className="rd-avatar-name">{user.fullName || "Reader"}</div>
          <div className="rd-avatar-email">{user.email}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: user.isOnline ? "#e6f4ea" : "#f0f0f0",
              color: user.isOnline ? "#1e6b35" : "#888",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%",
                background: user.isOnline ? "#1e6b35" : "#aaa", display: "inline-block" }} />
              {user.isOnline ? "Active" : "Offline"}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="rd-nav">
          {NAV.map(item => {
            // Badge for notifications — count of alerts (expiring/expired rentals)
            const badge = item.key === "notifications" && notifs.length > 0
              ? notifs.filter(n => n.type === "expired" || n.type === "expiring").length
              : 0;
            return (
              <button key={item.key}
                className={`rd-nav-item ${active === item.key ? "active" : ""}`}
                onClick={() => switchTab(item.key)}>
                <span className="rd-nav-icon">{item.icon}</span>
                {item.label}
                {badge > 0 && (
                  <span style={{
                    marginLeft: "auto", minWidth: 18, height: 18,
                    background: active === item.key ? "rgba(255,255,255,0.3)" : "#e53e3e",
                    color: "white", borderRadius: 20, fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 5px",
                  }}>{badge}</span>
                )}
              </button>
            );
          })}

          <div className="rd-nav-divider" />

          <button className="rd-nav-item rd-logout" onClick={handleLogout}>
            <span className="rd-nav-icon">→</span>Logout
          </button>
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="rd-main">

        {/* Topbar */}
        <div className="rd-topbar">
          <div>
            <h1 className="rd-topbar-title">
              {NAV.find(n => n.key === active)?.label || "My Account"}
            </h1>
            <p className="rd-topbar-sub">
              {active === "dashboard" ? "Welcome back, " + (user.fullName || "Reader") :
               active === "details"   ? "Manage your personal information" :
               active === "orders"    ? "Your completed purchases" :
               active === "library"   ? "Your purchased and rented books" :
               active === "payments"      ? "Your transaction history" :
               active === "history"       ? "All books you have read or rented" :
               active === "notifications" ? "Your activity and rental alerts" :
               "Preferences and notifications"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="rd-content">

          {/* ── Dashboard ── */}
          {active === "dashboard" && (
            <>
              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Books in Library", value: stats?.totalBooks ?? "—",    icon: "📚", bg: "#e6f4ea", color: "#1e6b35" },
                  { label: "Total Orders",     value: stats?.totalOrders ?? "—",   icon: "📋", bg: "#e8f0fe", color: "#1a56db" },
                  { label: "Total Spent",      value: stats ? `Rs ${parseFloat(stats.totalSpent).toLocaleString()}` : "—", icon: "💰", bg: "#fff8e1", color: "#b45309" },
                  { label: "Active Rentals",   value: stats?.activeRentals ?? "—", icon: "⏳", bg: "#fde8e8", color: "#b91c1c" },
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                {/* Quick actions */}
                <div className="rd-panel">
                  <div className="rd-panel-header">
                    <h3 className="rd-panel-title">Quick Actions</h3>
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { key: "library", icon: "📚", label: "My Library",   desc: "Read your books",          bg: "#e6f4ea", color: "#1e6b35" },
                      { key: "orders",  icon: "📋", label: "My Orders",    desc: "View order history",       bg: "#e8f0fe", color: "#1a56db" },
                      { key: "payments",icon: "💳", label: "Payments",     desc: "Transaction history",      bg: "#fff8e1", color: "#b45309" },
                    ].map(item => (
                      <div key={item.key} onClick={() => switchTab(item.key)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                          borderRadius: 8, cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: item.bg,
                          color: item.color, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{item.desc}</div>
                        </div>
                        <span style={{ color: "#bbb", fontSize: 14 }}>→</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid #f0f0f0", marginTop: 4, paddingTop: 8 }}>
                      <Link to="/browse"
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                          borderRadius: 8, textDecoration: "none", color: "inherit" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f0f0f0",
                          color: "#555", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, flexShrink: 0 }}>🔍</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>Browse Books</div>
                          <div style={{ fontSize: 11, color: "#888" }}>Discover new books</div>
                        </div>
                        <span style={{ color: "#bbb", fontSize: 14 }}>→</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Account summary */}
                <div className="rd-panel">
                  <div className="rd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 className="rd-panel-title">Account Summary</h3>
                    <button onClick={() => switchTab("details")}
                      style={{ fontSize: 11, color: "#3b5723", fontWeight: 600, background: "none",
                        border: "none", cursor: "pointer" }}>Edit →</button>
                  </div>
                  <div style={{ padding: "12px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["Full Name", user.fullName || "—"],
                      ["Email",     user.email    || "—"],
                      ["Phone",     user.phone    || "Not set"],
                      ["Address",   user.address  || "Not set"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 16, fontSize: 13, padding: "6px 0",
                        borderBottom: "1px solid #f5f5f5" }}>
                        <span style={{ width: 90, color: "#888", fontWeight: 600, flexShrink: 0 }}>{k}</span>
                        <span style={{ color: "#1a2912" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              {stats?.recentOrders?.length > 0 && (
                <div className="rd-panel">
                  <div className="rd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 className="rd-panel-title">Recent Activity</h3>
                    <button onClick={() => switchTab("orders")}
                      style={{ fontSize: 11, color: "#3b5723", fontWeight: 600, background: "none",
                        border: "none", cursor: "pointer" }}>View all →</button>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    {stats.recentOrders.map((o, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 22px", borderBottom: i < stats.recentOrders.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3b5723",
                          color: "white", fontSize: 12, fontWeight: 700, display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {o.book_title?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>{o.book_title}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            {o.item_type === "rent" ? "Rented" : "Purchased"} · Order #{o.order_id}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>
                            Rs {parseFloat(o.total_amount).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{fmtDate(o.paid_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Account Details ── */}
          {active === "details" && (
            <div className="rd-panel">
              {/* Profile header card */}
              <div style={{ background: "linear-gradient(135deg,#2d4419,#3b5723)", padding: "28px 28px 20px",
                display: "flex", alignItems: "center", gap: 20 }}>
                {/* Avatar with upload */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)",
                    color: "white", fontSize: 24, fontWeight: 800, overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {user.profileImage ? (
                      <img src={`http://localhost:5001/${user.profileImage}`} alt="avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : initials(user.fullName)}
                  </div>
                  {/* Upload button overlay */}
                  <label style={{ position: "absolute", bottom: 0, right: 0,
                    width: 22, height: 22, borderRadius: "50%", background: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", fontSize: 11 }}
                    title="Upload photo">
                    📷
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
                        const fd = new FormData();
                        fd.append("avatar", file);
                        const res = await fetch("http://localhost:5001/api/readers/upload-avatar", {
                          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd
                        }).then(r => r.json());
                        if (res.success) {
                          setUser(prev => ({ ...prev, profileImage: res.profileImage }));
                          // Save to localStorage so navbar picks it up
                          const stored = JSON.parse(localStorage.getItem("userData") || "{}");
                          localStorage.setItem("userData", JSON.stringify({ ...stored, profileImage: res.profileImage }));
                          window.dispatchEvent(new Event("userLoggedIn"));
                        }
                      }} />
                  </label>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{user.fullName || "Reader"}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{user.email}</div>
                  <span style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                    Reader Account
                  </span>
                </div>
              </div>

              <div style={{ padding: "24px 28px" }}>
                <MsgBox />
                <form onSubmit={handleUpdateProfile}>
                  {/* Personal Info section */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa",
                    textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>
                    Personal Information
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                    <Field label="Full Name" required>
                      <input style={inp} value={profileForm.fullName} placeholder="Your full name"
                        onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))} required />
                    </Field>
                    <Field label="Email Address" required>
                      <input style={inp} type="email" value={profileForm.email} placeholder="your@email.com"
                        onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} required />
                    </Field>
                  </div>

                  {/* Contact Info section */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa",
                    textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 16 }}>
                    Contact Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                    <Field label="Phone Number">
                      <input style={inp} value={profileForm.phone} placeholder="+977-98XXXXXXX"
                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                    </Field>
                    <Field label="Address">
                      <input style={inp} value={profileForm.address} placeholder="Kathmandu, Nepal"
                        onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} />
                    </Field>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" disabled={loading}
                      style={{ padding: "11px 28px", background: "#3b5723", color: "white",
                        border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer",
                        opacity: loading ? 0.7 : 1 }}>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button"
                      onClick={() => setProfileForm({ fullName: user.fullName, email: user.email,
                        phone: user.phone, address: user.address })}
                      style={{ padding: "11px 20px", background: "#f0f0f0", color: "#555",
                        border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {active === "settings" && (
            <>
              {/* ── Account Security ── */}
              <div className="rd-panel" style={{ marginBottom: 20 }}>
                <div className="rd-panel-header">
                  <h3 className="rd-panel-title">🔒 Account Security</h3>
                </div>
                <div style={{ padding: "0 22px" }}>
                  {/* Change Password row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>Password</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Change your account password</div>
                    </div>
                    <button
                      onClick={() => setShowPwForm(v => !v)}
                      style={{ padding: "7px 16px", background: showPwForm ? "#f0f0f0" : "#3b5723",
                        color: showPwForm ? "#555" : "white", border: "none", borderRadius: 7,
                        fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {showPwForm ? "Cancel" : "Change Password"}
                    </button>
                  </div>
                  {showPwForm && (
                    <div style={{ padding: "16px 0 20px" }}>
                      <MsgBox />
                      <form onSubmit={handleChangePassword}>
                        <Field label="Current Password" required>
                          <input style={inp} type="password" value={passwordForm.currentPassword}
                            onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} required />
                        </Field>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                          <Field label="New Password" required>
                            <input style={inp} type="password" value={passwordForm.newPassword}
                              placeholder="Min 8 chars"
                              onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} required />
                          </Field>
                          <Field label="Confirm New Password" required>
                            <input style={inp} type="password" value={passwordForm.confirmPassword}
                              placeholder="Re-enter password"
                              onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                          </Field>
                        </div>
                        <button type="submit" disabled={loading}
                          style={{ marginTop: 4, padding: "10px 24px", background: "#1a2912", color: "white",
                            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          {loading ? "Updating..." : "Update Password"}
                        </button>
                      </form>
                    </div>
                  )}
                  {/* Email verified row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 0" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>Email Address</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{user.email || "—"}</div>
                    </div>
                    <span style={{ background: "#e6f4ea", color: "#1e6b35", fontSize: 11,
                      fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>✓ Verified</span>
                  </div>
                </div>
              </div>

              {/* ── Notifications ── */}
              <div className="rd-panel" style={{ marginBottom: 20 }}>
                <div className="rd-panel-header">
                  <h3 className="rd-panel-title">🔔 Notification Preferences</h3>
                </div>
                <div style={{ padding: "0 22px" }}>
                  {[
                    { key: "emailNewBooks",    label: "New book releases",          desc: "Get notified when new books are added" },
                    { key: "emailRentExpiry",  label: "Rental expiry reminders",    desc: "Alert before your rental access expires" },
                    { key: "emailPayment",     label: "Payment confirmations",      desc: "Receive receipt after every purchase" },
                    { key: "emailRecommend",   label: "Book recommendations",       desc: "Personalized suggestions based on your reading" },
                  ].map((item, i, arr) => (
                    <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{item.desc}</div>
                      </div>
                      {/* Toggle switch */}
                      <label style={{ position: "relative", display: "inline-block", width: 40, height: 22, flexShrink: 0, cursor: "pointer" }}>
                        <input type="checkbox" defaultChecked={item.key !== "emailRecommend"}
                          style={{ opacity: 0, width: 0, height: 0 }}
                          onChange={() => {}} />
                        <span style={{
                          position: "absolute", inset: 0, borderRadius: 22,
                          background: item.key !== "emailRecommend" ? "#3b5723" : "#ccc",
                          transition: "background 0.2s",
                        }}>
                          <span style={{
                            position: "absolute", left: item.key !== "emailRecommend" ? 20 : 2,
                            top: 2, width: 18, height: 18, borderRadius: "50%",
                            background: "white", transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }} />
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Reading Preferences ── */}
              <div className="rd-panel" style={{ marginBottom: 20 }}>
                <div className="rd-panel-header">
                  <h3 className="rd-panel-title">📖 Reading Preferences</h3>
                </div>
                <div style={{ padding: "0 22px" }}>
                  {[
                    { label: "Auto-open last read page",    desc: "Resume from where you left off",         defaultOn: true  },
                    { label: "Show reading progress",       desc: "Display progress bar while reading",     defaultOn: true  },
                    { label: "Download books for offline",  desc: "Allow PDF downloads for purchased books",defaultOn: false },
                  ].map((item, i, arr) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <label style={{ position: "relative", display: "inline-block", width: 40, height: 22, flexShrink: 0, cursor: "pointer" }}>
                        <input type="checkbox" defaultChecked={item.defaultOn} style={{ opacity: 0, width: 0, height: 0 }} onChange={() => {}} />
                        <span style={{
                          position: "absolute", inset: 0, borderRadius: 22,
                          background: item.defaultOn ? "#3b5723" : "#ccc", transition: "background 0.2s",
                        }}>
                          <span style={{
                            position: "absolute", left: item.defaultOn ? 20 : 2, top: 2,
                            width: 18, height: 18, borderRadius: "50%", background: "white",
                            transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }} />
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── About Account ── */}
              <div className="rd-panel" style={{ marginBottom: 20 }}>
                <div className="rd-panel-header">
                  <h3 className="rd-panel-title">ℹ️ About</h3>
                </div>
                <div style={{ padding: "0 22px" }}>
                  {[
                    ["Platform", "Pustakyatra — Digital Library"],
                    ["Account Type", "Reader"],
                    ["Member Since", user.email ? new Date().getFullYear() + "" : "—"],
                    ["App Version", "v1.0.0"],
                  ].map(([k, v], i, arr) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "13px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none",
                      fontSize: 13 }}>
                      <span style={{ color: "#888", fontWeight: 500 }}>{k}</span>
                      <span style={{ color: "#1a2912", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Danger Zone ── */}
              <div className="rd-panel" style={{ border: "1px solid #fca5a5" }}>
                <div className="rd-panel-header" style={{ borderBottom: "1px solid #fde8e8" }}>
                  <h3 className="rd-panel-title" style={{ color: "#b91c1c" }}>⚠️ Danger Zone</h3>
                </div>
                <div style={{ padding: "16px 22px", display: "flex", alignItems: "center",
                  justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>Sign out of all devices</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Revoke all active sessions</div>
                  </div>
                  <button onClick={handleLogout}
                    style={{ padding: "8px 18px", background: "#fde8e8", color: "#b91c1c",
                      border: "1px solid #fca5a5", borderRadius: 7, fontSize: 12,
                      fontWeight: 700, cursor: "pointer" }}>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── My Orders ── */}
          {active === "orders" && (
            <div className="rd-panel">
              <div className="rd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="rd-panel-title">My Orders</h3>
                <Link to="/browse" style={{ fontSize: 12, color: "#3b5723", fontWeight: 600, textDecoration: "none" }}>Browse Books →</Link>
              </div>
              {!ordersLoaded ? (
                <p style={{ padding: "24px 22px", color: "#888", fontSize: 13 }}>Loading orders...</p>
              ) : orders.length === 0 ? (
                <div style={{ padding: "48px 22px", textAlign: "center", color: "#aaa" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>No purchases yet</p>
                  <p style={{ fontSize: 12, margin: 0 }}>Your completed orders will appear here.</p>
                </div>
              ) : (
                <div style={{ padding: "12px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {orders.map(order => (
                    <div key={order.orderId} style={{
                      border: "1px solid #f0f0f0", borderRadius: 10, overflow: "hidden"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 16px", background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>Order #{order.orderId}</span>
                          <span style={{ fontSize: 11, color: "#aaa" }}>{fmtDate(order.createdAt)}</span>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span style={{ background: "#e6f4ea", color: "#1e6b35", fontSize: 11,
                            fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Paid</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>
                            Rs {parseFloat(order.totalAmount).toFixed(2)}
                          </span>
                          <button onClick={() => setReceipt(order)}
                            style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                              background: "#f0f0f0", border: "none", cursor: "pointer", color: "#555" }}>
                            View Receipt
                          </button>
                        </div>
                      </div>
                      {order.items?.map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 16px", borderBottom: i < order.items.length - 1 ? "1px solid #f7f7f7" : "none" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3b5723",
                            color: "white", fontSize: 12, fontWeight: 700, display: "flex",
                            alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {item.bookTitle?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>{item.bookTitle}</div>
                            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                              {item.itemType === "rent" ? "Rental · " + (item.accessExpiresAt ? "expires " + fmtDate(item.accessExpiresAt) : item.rentDays + " days") : "Purchased · Permanent access"}
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>
                            Rs {parseFloat(item.totalPrice).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div style={{ padding: "8px 16px", fontSize: 11, color: "#aaa", background: "#fafafa" }}>
                        ✓ Paid {fmtDateTime(order.paidAt)}
                        {order.transactionCode && <span style={{ marginLeft: 12 }}>Ref: {order.transactionCode}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── My Library ── */}
          {active === "library" && (
            <div className="rd-panel">
              <div className="rd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="rd-panel-title">My Library</h3>
                <Link to="/browse" style={{ fontSize: 12, color: "#3b5723", fontWeight: 600, textDecoration: "none" }}>Browse Books →</Link>
              </div>
              {!libLoaded ? (
                <p style={{ padding: "24px 22px", color: "#888", fontSize: 13 }}>Loading library...</p>
              ) : library.length === 0 ? (
                <div style={{ padding: "48px 22px", textAlign: "center", color: "#aaa" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>Your library is empty</p>
                  <p style={{ fontSize: 12, margin: 0 }}>Books you purchase or rent will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Search + Filter row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12, padding: "14px 22px 0", flexWrap: "wrap" }}>
                    {/* Left: search + button */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        value={libSearch}
                        onChange={e => setLibSearch(e.target.value)}
                        placeholder="Search books..."
                        style={{ width: 200, padding: "8px 12px", border: "1px solid #e0e0e0",
                          borderRadius: 8, fontSize: 13, outline: "none", background: "#fafafa" }}
                      />
                      <button style={{ padding: "8px 16px", background: "#3b5723", color: "white",
                        border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        Search
                      </button>
                    </div>
                    {/* Right: filter buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {[["all","All"],["buy","Purchased"],["rent","Rented"]].map(([key, label]) => (
                        <button key={key} onClick={() => setLibFilter(key)} style={{
                          padding: "7px 16px", borderRadius: 8, border: "1px solid",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: libFilter === key ? "#3b5723" : "white",
                          color: libFilter === key ? "white" : "#555",
                          borderColor: libFilter === key ? "#3b5723" : "#e0e0e0",
                          transition: "all 0.15s",
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "16px 22px", display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                    {library
                      .filter(b => libFilter === "all" || b.accessType === libFilter)
                      .filter(b => !libSearch || b.bookTitle?.toLowerCase().includes(libSearch.toLowerCase()))
                      .map((book, i) => {
                      const isRent = book.accessType === "rent";
                      const remaining = isRent ? daysLeft(book.rentExpiresAt) : null;
                      const expired = remaining !== null && remaining <= 0;
                      return (
                        <div key={i} style={{ border: "1px solid #f0f0f0", borderRadius: 10,
                          padding: 16, background: expired ? "#fafafa" : "white",
                          display: "flex", flexDirection: "column", gap: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: "#3b5723",
                              color: "white", fontSize: 14, fontWeight: 700, display: "flex",
                              alignItems: "center", justifyContent: "center" }}>
                              {book.bookTitle?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                              background: isRent ? "#e8f0fe" : "#e6f4ea",
                              color: isRent ? "#1a56db" : "#1e6b35" }}>
                              {isRent ? "Rent" : "Owned"}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2912", lineHeight: 1.3 }}>
                            {book.bookTitle}
                          </div>
                          <div style={{ fontSize: 11, color: expired ? "#b91c1c" : remaining !== null && remaining <= 3 ? "#b45309" : "#888" }}>
                            {!isRent ? "✓ Permanent access" :
                             expired ? "Rental expired" :
                             remaining === 0 ? "Expires today" :
                             `${remaining} day${remaining !== 1 ? "s" : ""} left`}
                          </div>
                          {!expired ? (
                            <button onClick={() => handleReadNow(book.bookId)}
                              disabled={openingBook === book.bookId}
                              style={{ padding: "8px 0", background: "#3b5723", color: "white",
                                border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700,
                                cursor: "pointer", opacity: openingBook === book.bookId ? 0.7 : 1 }}>
                              {openingBook === book.bookId ? "Opening..." : "Read Now"}
                            </button>
                          ) : (
                            <Link to={`/book/${book.bookId}`} style={{ padding: "8px 0", background: "#f0f0f0",
                              color: "#555", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700,
                              cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}>
                              Renew Rental
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Payments ── */}
          {active === "payments" && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Payment History</h3>
              </div>
              {!ordersLoaded ? (
                <p style={{ padding: "24px 22px", color: "#888", fontSize: 13 }}>Loading payments...</p>
              ) : orders.length === 0 ? (
                <div style={{ padding: "48px 22px", textAlign: "center", color: "#aaa" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>💳</div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>No transactions yet</p>
                  <p style={{ fontSize: 12, margin: 0 }}>Your payment history will appear here.</p>
                </div>
              ) : (
                <>
                  {/* Summary row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, padding: "16px 22px 0" }}>
                    {[
                      { label: "Total Paid", value: "Rs " + orders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0).toLocaleString(), bg: "#e6f4ea", color: "#1e6b35", icon: "💰" },
                      { label: "Transactions", value: orders.length, bg: "#e8f0fe", color: "#1a56db", icon: "📄" },
                      { label: "Books Owned", value: orders.reduce((s, o) => s + (o.items?.filter(i => i.itemType === "buy").length || 0), 0), bg: "#fff8e1", color: "#b45309", icon: "📚" },
                    ].map(s => (
                      <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "14px 16px",
                        display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 22 }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a2912" }}>{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transaction table */}
                  <div style={{ overflowX: "auto", padding: "16px 22px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#fafafa" }}>
                          {["Order #", "Books", "Amount", "Method", "Status", "Date", ""].map(h => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11,
                              fontWeight: 700, color: "#888", textTransform: "uppercase",
                              letterSpacing: "0.5px", borderBottom: "1px solid #f0f0f0" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order, i) => (
                          <tr key={order.orderId} style={{ borderBottom: i < orders.length - 1 ? "1px solid #f7f7f7" : "none" }}>
                            <td style={{ padding: "12px 12px", fontWeight: 700, color: "#1a2912" }}>
                              #{order.orderId}
                            </td>
                            <td style={{ padding: "12px 12px", color: "#555", maxWidth: 180 }}>
                              {order.items?.map(it => it.bookTitle).join(", ") || "—"}
                            </td>
                            <td style={{ padding: "12px 12px", fontWeight: 700, color: "#1a2912" }}>
                              Rs {parseFloat(order.totalAmount).toLocaleString()}
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <span style={{ background: "#e8f0fe", color: "#1a56db", fontSize: 11,
                                fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>eSewa</span>
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <span style={{ background: "#e6f4ea", color: "#1e6b35", fontSize: 11,
                                fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Paid</span>
                            </td>
                            <td style={{ padding: "12px 12px", color: "#888", fontSize: 12 }}>
                              {fmtDateTime(order.paidAt)}
                              {order.transactionCode && (
                                <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>
                                  Ref: {order.transactionCode}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <button onClick={() => setReceipt(order)}
                                style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px",
                                  borderRadius: 6, background: "#f0f0f0", border: "none",
                                  cursor: "pointer", color: "#555", whiteSpace: "nowrap" }}>
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Reading History ── */}
          {active === "history" && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Reading History</h3>
                <span style={{ fontSize: 12, color: "#888" }}>All books you've purchased or rented</span>
              </div>
              {!ordersLoaded ? (
                <p style={{ padding: "24px 22px", color: "#888", fontSize: 13 }}>Loading history...</p>
              ) : orders.length === 0 ? (
                <div style={{ padding: "48px 22px", textAlign: "center", color: "#aaa" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🕐</div>
                  <p style={{ fontSize: 14, margin: 0 }}>No reading history yet.</p>
                </div>
              ) : (
                <div style={{ padding: "8px 0" }}>
                  {orders.flatMap(order =>
                    (order.items || []).map((item, i) => {
                      const isRent = item.itemType === "rent";
                      const expired = isRent && item.accessExpiresAt && new Date(item.accessExpiresAt) < new Date();
                      const remaining = isRent && item.accessExpiresAt
                        ? Math.floor((new Date(item.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
                        : null;
                      return (
                        <div key={`${order.orderId}-${i}`} style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "14px 22px", borderBottom: "1px solid #f5f5f5"
                        }}>
                          {/* Book avatar */}
                          <div style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                            background: expired ? "#f0f0f0" : "#3b5723",
                            color: expired ? "#aaa" : "white", fontSize: 13, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {item.bookTitle?.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase()}
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>{item.bookTitle}</div>
                            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                              {isRent ? (
                                expired
                                  ? `Rental expired · ${fmtDate(item.accessExpiresAt)}`
                                  : `Rental active · ${remaining} day${remaining !== 1 ? "s" : ""} left`
                              ) : "Purchased · Permanent access"}
                            </div>
                            <div style={{ fontSize: 10, color: "#bbb", marginTop: 1 }}>
                              Paid {fmtDate(order.paidAt || order.createdAt)}
                            </div>
                          </div>
                          {/* Status badge */}
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                            background: expired ? "#f0f0f0" : isRent ? "#e8f0fe" : "#e6f4ea",
                            color: expired ? "#aaa" : isRent ? "#1a56db" : "#1e6b35",
                          }}>
                            {expired ? "Expired" : isRent ? "Rented" : "Owned"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Notifications ── */}
          {active === "notifications" && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <div>
                  <h3 className="rd-panel-title">Notifications</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
                    Payment confirmations and rental alerts
                  </p>
                </div>
                {notifs.length > 0 && (
                  <span style={{ fontSize: 12, color: "#888" }}>{notifs.length} notification{notifs.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {!notifsLoaded ? (
                <p style={{ padding: "24px 22px", color: "#888", fontSize: 13 }}>Loading notifications...</p>
              ) : notifs.length === 0 ? (
                <div style={{ padding: "48px 22px", textAlign: "center", color: "#aaa" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
                  <p style={{ fontSize: 14, margin: "0 0 6px" }}>No notifications yet</p>
                  <p style={{ fontSize: 12, margin: 0 }}>Activity from your orders and rentals will appear here.</p>
                </div>
              ) : (
                <div style={{ padding: "8px 0" }}>
                  {notifs.map((n, idx) => {
                    const BADGE = {
                      payment:  { label: "Payment",  bg: "#e6f4ea", color: "#1e6b35" },
                      rent:     { label: "Rental",   bg: "#e8f0fe", color: "#1a56db" },
                      expiring: { label: "Expiring", bg: "#fff8e1", color: "#b45309" },
                      expired:  { label: "Expired",  bg: "#fde8e8", color: "#b91c1c" },
                    };
                    const badge = BADGE[n.type] || { label: n.type, bg: "#f0f0f0", color: "#555" };
                    return (
                      <div key={n.id} style={{
                        display: "flex", alignItems: "flex-start", gap: 14,
                        padding: "14px 22px",
                        borderBottom: idx < notifs.length - 1 ? "1px solid #f5f5f5" : "none",
                        background: (n.type === "expired" || n.type === "expiring") ? "#fffdf5" : "white",
                        transition: "background 0.15s",
                      }}>
                        {/* Icon */}
                        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: n.bg, color: n.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 17, marginTop: 2 }}>
                          {n.icon}
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>{n.title}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                              background: badge.bg, color: badge.color }}>
                              {badge.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                            {n.time ? new Date(n.time).toLocaleString("en-NP", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            }) : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Receipt Modal */}
      {receipt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
          onClick={() => setReceipt(null)}>
          <div style={{ background: "white", borderRadius: 16, width: 440, maxHeight: "90vh",
            overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#2d4419,#3b5723)", padding: "24px 28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>Payment Receipt</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>
                    Rs {parseFloat(receipt.totalAmount).toFixed(2)}
                  </div>
                </div>
                <span style={{ background: "rgba(34,197,94,0.2)", color: "#86efac",
                  fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                  border: "1px solid rgba(34,197,94,0.3)" }}>✓ Paid</span>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "20px 28px" }}>
              {[
                ["Order ID",       `#${receipt.orderId}`],
                ["Payment Date",   fmtDateTime(receipt.paidAt)],
                ["Transaction Ref", receipt.transactionCode || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                  <span style={{ color: "#888", fontWeight: 500 }}>{k}</span>
                  <span style={{ color: "#1a2912", fontWeight: 700, textAlign: "right",
                    maxWidth: 220, wordBreak: "break-all" }}>{v}</span>
                </div>
              ))}

              {/* Books */}
              {receipt.items?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa",
                    textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
                    Books Purchased
                  </div>
                  {receipt.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "10px 0",
                      borderBottom: i < receipt.items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2912" }}>{item.bookTitle}</div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                          {item.itemType === "rent"
                            ? `Rental · ${item.rentDays} days`
                            : "Purchased · Permanent access"}
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2912" }}>
                        Rs {parseFloat(item.totalPrice).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between",
                    padding: "12px 0 0", fontSize: 14, fontWeight: 800, color: "#1a2912" }}>
                    <span>Total</span>
                    <span>Rs {parseFloat(receipt.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button onClick={() => setReceipt(null)}
                style={{ marginTop: 20, width: "100%", padding: "11px", background: "#3b5723",
                  color: "white", border: "none", borderRadius: 8, fontSize: 13,
                  fontWeight: 700, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
