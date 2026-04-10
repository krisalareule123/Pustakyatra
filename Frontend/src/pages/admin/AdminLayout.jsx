import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./AdminLayout.css";

const NAV = [
  { path: "/admin/dashboard",      icon: "▣", label: "Dashboard" },
  { path: "/admin/users",          icon: "👥", label: "Users" },
  { path: "/admin/authors",        icon: "✍️", label: "Authors" },
  { path: "/admin/books",          icon: "📚", label: "Books" },
  { path: "/admin/payments",       icon: "💳", label: "Payments" },
  { path: "/admin/reviews",        icon: "⭐", label: "Reviews" },
  { path: "/admin/analytics",      icon: "📈", label: "Analytics" },
  { path: "/admin/notifications",  icon: "🔔", label: "Notifications" },
  { path: "/admin/settings",       icon: "⚙️", label: "Settings" },
];

const PAGE_META = {
  "/admin/dashboard":     { title: "Dashboard",     sub: "Overview of Pustakyatra platform" },
  "/admin/users":         { title: "Users",          sub: "Manage reader accounts" },
  "/admin/authors":       { title: "Authors",        sub: "Manage author accounts and books" },
  "/admin/books":         { title: "Books",          sub: "Manage all uploaded books" },
  "/admin/payments":      { title: "Payments",       sub: "View all transactions and revenue" },
  "/admin/reviews":       { title: "Reviews",        sub: "Moderate reader reviews" },
  "/admin/analytics":     { title: "Analytics",      sub: "Platform performance metrics and insights" },
  "/admin/notifications": { title: "Notifications",  sub: "System activity and alerts" },
  "/admin/settings":      { title: "Settings",       sub: "Admin preferences and configuration" },
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: "Admin", sub: "" };
  const [badges, setBadges] = useState({ reviews: 0, notifications: 0 });

  // Guard — redirect to login if no token
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { navigate("/admin/login", { replace: true }); return; }

    // Fetch badge counts
    const h = { Authorization: `Bearer ${token}` };
    const fetchBadges = () => {
      Promise.all([
        fetch("http://localhost:5001/api/admin/reviews",       { headers: h }).then(r => r.json()).catch(() => null),
        fetch("http://localhost:5001/api/admin/notifications", { headers: h }).then(r => r.json()).catch(() => null),
      ]).then(([rev, notif]) => {
        setBadges({
          reviews:       rev?.reviews?.filter(r => r.status === "pending").length || 0,
          notifications: notif?.unread || 0,
        });
      });
    };
    fetchBadges();
    const id = setInterval(fetchBadges, 60000);
    window.addEventListener("adminBadgeRefresh", fetchBadges);
    return () => { clearInterval(id); window.removeEventListener("adminBadgeRefresh", fetchBadges); };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-logo">
            <div className="admin-brand-dot">P</div>
            <div>
              <div className="admin-brand-name">Pustakyatra</div>
              <div className="admin-brand-sub">Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map(item => {
            const badge = item.path === "/admin/reviews" ? badges.reviews
                        : item.path === "/admin/notifications" ? badges.notifications
                        : 0;
            return (
              <button
                key={item.path}
                className={`admin-nav-item ${location.pathname === item.path ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
                {badge > 0 && (
                  <span style={{
                    marginLeft: "auto", minWidth: 18, height: 18,
                    background: location.pathname === item.path ? "rgba(255,255,255,0.3)" : "#e53e3e",
                    color: "white", borderRadius: 20, fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 5px",
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-nav-divider" style={{ margin: "0 0 8px" }} />
          <button className="admin-nav-item" onClick={handleLogout}>
            <span className="admin-nav-icon">→</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-avatar" title="Admin">A</div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
