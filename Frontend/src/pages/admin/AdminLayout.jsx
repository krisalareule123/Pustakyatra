import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./AdminLayout.css";

const NAV = [
  { path: "/admin/dashboard",      icon: "▣", label: "Dashboard" },
  { path: "/admin/users",          icon: "👥", label: "Users" },
  { path: "/admin/authors",        icon: "✍️", label: "Authors" },
  { path: "/admin/books",          icon: "📚", label: "Books" },
  { path: "/admin/payments",       icon: "💳", label: "Payments" },
  { path: "/admin/reviews",        icon: "⭐", label: "Reviews" },
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
  "/admin/notifications": { title: "Notifications",  sub: "System activity and alerts" },
  "/admin/settings":      { title: "Settings",       sub: "Admin preferences and configuration" },
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: "Admin", sub: "" };

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
          {NAV.map(item => (
            <button
              key={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="admin-nav-divider" />
          <button className="admin-nav-item" onClick={handleLogout}>
            <span className="admin-nav-icon">→</span>
            Sign Out
          </button>
        </nav>
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
