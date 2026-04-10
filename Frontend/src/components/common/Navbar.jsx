import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",          label: "Home"         },
  { to: "/browse",    label: "Browse Books" },
  { to: "/categories",label: "Categories"   },
  { to: "/authors",   label: "Authors"      },
  { to: "/about",     label: "About"        },
];

export default function Navbar() {
  const navigate    = useNavigate();
  const location    = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user,       setUser]       = useState(null);
  const [cartCount,  setCartCount]  = useState(0);

  // Auth state
  useEffect(() => {
    const check = () => {
      const token    = localStorage.getItem("token") || localStorage.getItem("authToken");
      const userData = localStorage.getItem("userData");
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };
    check();
    window.addEventListener("storage",      check);
    window.addEventListener("userLoggedIn", check);
    window.addEventListener("userLoggedOut",check);
    return () => {
      window.removeEventListener("storage",      check);
      window.removeEventListener("userLoggedIn", check);
      window.removeEventListener("userLoggedOut",check);
    };
  }, []);

  // Cart count
  useEffect(() => {
    const update = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.reduce((s, i) => s + i.quantity, 0));
    };
    update();
    window.addEventListener("storage",     update);
    window.addEventListener("cartUpdated", update);
    return () => {
      window.removeEventListener("storage",     update);
      window.removeEventListener("cartUpdated", update);
    };
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setIsLoggedIn(false);
    setUser(null);
    window.dispatchEvent(new Event("userLoggedOut"));
    navigate("/");
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* LEFT — Logo */}
        <div className="navbar-brand">
          <div className="brand-dot" />
          <Link to="/" className="brand-name">Pustakyatra</Link>
        </div>

        {/* CENTER — Nav links */}
        <nav className="nav-menu">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${isActive(to) ? "nav-link-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* RIGHT — Cart + Auth */}
        <div className="navbar-actions">
          {/* Cart */}
          <button
            type="button"
            className="action-btn cart-btn"
            aria-label="Shopping Cart"
            onClick={() => window.dispatchEvent(new Event("openCart"))}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>

          {/* Auth */}
          {isLoggedIn ? (
            <Link to="/dashboard" className="profile-btn" style={{ textDecoration: "none" }}>
              <div className="profile-avatar">
                {user?.profileImage ? (
                  <img src={`http://localhost:5001/${user.profileImage}`} alt="Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=3b5723&color=fff&size=100`}
                    alt="Profile"
                  />
                )}
              </div>
              <span className="profile-name">{user?.fullName || "User"}</span>
            </Link>
          ) : (
            <Link to="/login" className="login-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Sign In</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
