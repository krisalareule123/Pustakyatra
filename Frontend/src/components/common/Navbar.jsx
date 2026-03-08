import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Check login status on component mount and listen for storage changes
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    // Check on mount
    checkAuthStatus();

    // Listen for storage changes (for cross-tab updates)
    window.addEventListener('storage', checkAuthStatus);
    
    // Listen for custom login event
    window.addEventListener('userLoggedIn', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('userLoggedIn', checkAuthStatus);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUser(null);
    setShowDropdown(false);
    navigate('/');
  };
  return (
    <header className="navbar">
      {/* Main Navigation */}
      <div className="navbar-main">
        <div className="navbar-container">
          {/* Brand Section */}
          <div className="navbar-brand">
            <div className="brand-logo">
              <div className="brand-dot"></div>
              <Link to="/" className="brand-name">Pustakyatra</Link>
            </div>
          </div>

          {/* Search Section */}
          <div className="navbar-search">
            <div className="search-wrapper">
              <div className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search books, authors, or ISBN..."
                className="search-input"
              />
              <button type="button" className="search-btn">
                Search
              </button>
            </div>
          </div>

          {/* Actions Section */}
          <div className="navbar-actions">
            <button type="button" className="action-btn cart-btn" aria-label="Shopping Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="cart-count">0</span>
            </button>

            {isLoggedIn ? (
              <div className="profile-dropdown" ref={dropdownRef}>
                <button 
                  type="button" 
                  className="profile-btn"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="profile-avatar">
                    <img 
                      src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=100&auto=format&fit=crop&q=60" 
                      alt="Profile"
                    />
                  </div>
                  <span className="profile-name">{user?.fullName || 'User'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {showDropdown && (
                  <div className="profile-menu">
                    <Link to="/dashboard" className="profile-menu-item" onClick={() => setShowDropdown(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                        <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                        <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                        <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Dashboard
                    </Link>
                    <Link to="/my-library" className="profile-menu-item" onClick={() => setShowDropdown(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      My Library
                    </Link>
                    <Link to="/settings" className="profile-menu-item" onClick={() => setShowDropdown(false)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Settings
                    </Link>
                    <div className="profile-menu-divider"></div>
                    <button type="button" className="profile-menu-item logout" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="navbar-secondary">
        <div className="navbar-container">
          <nav className="nav-menu">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/browse" className="nav-link">Browse Books</Link>
            <Link to="/categories" className="nav-link">Categories</Link>
            <Link to="/authors" className="nav-link">Authors</Link>
            <Link to="/about" className="nav-link">About</Link>
          </nav>

          <div className="nav-contact">
            <div className="contact-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>+977-98XXXXXXX</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
