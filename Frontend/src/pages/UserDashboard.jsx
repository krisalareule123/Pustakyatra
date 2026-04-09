import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { readerAPI, orderAPI } from "../services/api";
import "./UserDashboard.css";

const NAV = [
  { key: "dashboard", icon: "▣",  label: "Dashboard"       },
  { key: "details",   icon: "👤", label: "Account Details" },
  { key: "password",  icon: "🔒", label: "Change Password" },
  { key: "settings",  icon: "⚙️", label: "Settings"        },
  { key: "orders",    icon: "📋", label: "My Orders"       },
  { key: "library",   icon: "📚", label: "My Library"      },
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
  const [user,   setUser]   = useState({ fullName: "", email: "", phone: "", address: "" });
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
                      phone: res.user.phone || "", address: res.user.address || "" };
          setUser(d); setProfileForm(d);
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
        setUser(profileForm);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    window.dispatchEvent(new Event("userLoggedOut"));
    navigate("/login");
  };

  const switchTab = (key) => {
    setActive(key);
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (key === "orders" && !ordersLoaded) {
      orderAPI.getMyOrders(token, "paid")
        .then(res => { if (res.success) setOrders(res.orders); })
        .finally(() => setOrdersLoaded(true));
    }
    if (key === "library" && !libLoaded) {
      orderAPI.getLibrary(token)
        .then(res => { if (res.success) setLibrary(res.library); })
        .finally(() => setLibLoaded(true));
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
    return Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
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
          <div className="rd-avatar">{initials(user.fullName)}</div>
          <div className="rd-avatar-name">{user.fullName || "Reader"}</div>
          <div className="rd-avatar-email">{user.email}</div>
        </div>

        {/* Nav */}
        <nav className="rd-nav">
          {NAV.map(item => (
            <button key={item.key}
              className={`rd-nav-item ${active === item.key ? "active" : ""}`}
              onClick={() => switchTab(item.key)}>
              <span className="rd-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}

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
               active === "password"  ? "Keep your account secure" :
               active === "orders"    ? "Your completed purchases" :
               active === "library"   ? "Your purchased and rented books" :
               "Preferences and notifications"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="rd-content">

          {/* ── Dashboard ── */}
          {active === "dashboard" && (
            <>
              {/* Quick action cards */}
              <div className="rd-cards">
                <div className="rd-card" style={{ cursor: "pointer" }} onClick={() => switchTab("library")}>
                  <div className="rd-card-icon" style={{ background: "#e6f4ea", color: "#1e6b35" }}>📚</div>
                  <div>
                    <div className="rd-card-label">My Library</div>
                    <div className="rd-card-desc">Access your purchased and rented books</div>
                  </div>
                  <span className="rd-card-arrow">→</span>
                </div>
                <div className="rd-card" style={{ cursor: "pointer" }} onClick={() => switchTab("orders")}>
                  <div className="rd-card-icon" style={{ background: "#e8f0fe", color: "#1a56db" }}>📋</div>
                  <div>
                    <div className="rd-card-label">My Orders</div>
                    <div className="rd-card-desc">View your payment and order history</div>
                  </div>
                  <span className="rd-card-arrow">→</span>
                </div>
                <Link to="/browse" className="rd-card">
                  <div className="rd-card-icon" style={{ background: "#fff8e1", color: "#b45309" }}>🔍</div>
                  <div>
                    <div className="rd-card-label">Browse Books</div>
                    <div className="rd-card-desc">Discover new Nepali books to read</div>
                  </div>
                  <span className="rd-card-arrow">→</span>
                </Link>
              </div>

              {/* Account summary */}
              <div className="rd-panel">
                <div className="rd-panel-header">
                  <h3 className="rd-panel-title">Account Summary</h3>
                </div>
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Full Name", user.fullName || "—"],
                    ["Email",     user.email    || "—"],
                    ["Phone",     user.phone    || "Not set"],
                    ["Address",   user.address  || "Not set"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 16, fontSize: 13, padding: "6px 0",
                      borderBottom: "1px solid #f5f5f5" }}>
                      <span style={{ width: 100, color: "#888", fontWeight: 600, flexShrink: 0 }}>{k}</span>
                      <span style={{ color: "#1a2912" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Account Details ── */}
          {active === "details" && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Profile Information</h3>
              </div>
              <div style={{ padding: "20px 22px" }}>
                <MsgBox />
                <form onSubmit={handleUpdateProfile}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="Full Name" required>
                      <input style={inp} value={profileForm.fullName}
                        onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))} required />
                    </Field>
                    <Field label="Email Address" required>
                      <input style={inp} type="email" value={profileForm.email}
                        onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} required />
                    </Field>
                    <Field label="Phone Number">
                      <input style={inp} value={profileForm.phone} placeholder="+977-98XXXXXXX"
                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                    </Field>
                    <Field label="Address">
                      <input style={inp} value={profileForm.address} placeholder="Your address"
                        onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} />
                    </Field>
                  </div>
                  <button type="submit" disabled={loading}
                    style={{ marginTop: 8, padding: "11px 28px", background: "#3b5723", color: "white",
                      border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Change Password ── */}
          {active === "password" && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Change Password</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>
                  Use a strong password with uppercase, numbers, and special characters.
                </p>
              </div>
              <div style={{ padding: "20px 22px" }}>
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
                    style={{ marginTop: 8, padding: "11px 28px", background: "#1a2912", color: "white",
                      border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {active === "settings" && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Preferences</h3>
              </div>
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  "Receive email updates about new books",
                  "Show personalized book recommendations",
                  "Notify me when a rented book is about to expire",
                ].map(label => (
                  <label key={label} style={{ display: "flex", alignItems: "center", gap: 10,
                    fontSize: 13, color: "#333", cursor: "pointer" }}>
                    <input type="checkbox" style={{ width: 16, height: 16, accentColor: "#3b5723" }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
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
                  {/* Filter tabs */}
                  <div style={{ display: "flex", gap: 8, padding: "12px 22px 0", flexWrap: "wrap" }}>
                    {[["all","All Books"],["buy","Purchased"],["rent","Rented"]].map(([key, label]) => (
                      <button key={key} onClick={() => setLibFilter(key)} style={{
                        padding: "5px 14px", borderRadius: 20, border: "1px solid",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        background: libFilter === key ? "#3b5723" : "white",
                        color: libFilter === key ? "white" : "#555",
                        borderColor: libFilter === key ? "#3b5723" : "#ddd",
                      }}>{label}</button>
                    ))}
                  </div>
                  <div style={{ padding: "16px 22px", display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                    {library.filter(b => libFilter === "all" || b.accessType === libFilter).map((book, i) => {
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

        </div>
      </main>
    </div>
  );
}
