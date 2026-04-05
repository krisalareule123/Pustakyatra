import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AuthorLayout.css";

export default function AuthorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const authorData = (() => {
    try { return JSON.parse(localStorage.getItem("authorData") || "{}"); } catch { return {}; }
  })();
  const authorName = authorData.fullName || "Author";
  const authorInitial = authorName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("authorToken");
    localStorage.removeItem("authorData");
    navigate("/");
  };

  const menuItems = [
    { path: "/author/dashboard", icon: "▣", label: "Dashboard" },
    { path: "/author/books", icon: "▤", label: "My Books" },
    { path: "/author/add-book", icon: "+", label: "Add Book" },
    { path: "/author/sales", icon: "₹", label: "Sales & Earnings" },
    { path: "/author/reviews", icon: "★", label: "Reviews" },
    { path: "/author/profile", icon: "◉", label: "Profile" },
  ];

  return (
    <aside className="author-sidebar">
      <div className="author-sidebar-header">
        <div className="author-sidebar-brand">
          <div className="author-brand-icon">P</div>
          <div className="author-brand-text">
            <div className="author-brand-title">Author Panel</div>
            <div className="author-brand-subtitle">Pustakyatra</div>
          </div>
        </div>
      </div>

      {/* Author identity */}
      <div className="author-identity">
        <div className="author-identity-avatar">{authorInitial}</div>
        <div className="author-identity-info">
          <div className="author-identity-name">{authorName}</div>
          <div className="author-identity-role">Author</div>
        </div>
      </div>

      <nav className="author-sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`author-nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="author-nav-icon">{item.icon}</span>
            <span className="author-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="author-sidebar-footer">
        <button className="author-logout-btn" onClick={handleLogout}>
          <span className="author-nav-icon">→</span>
          <span className="author-nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}