import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-column footer-brand">
            <div className="brand-header">
              <div className="brand-dot"></div>
              <div className="brand-name">Pustakyatra</div>
            </div>
            <p className="brand-tagline">
              Nepal's premier digital library for discovering and sharing beautiful Nepali literature.
            </p>
            <div className="brand-stats">
              <div className="stat-item">
                <span className="stat-number">12k+</span>
                <span className="stat-label">Readers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">2.5k+</span>
                <span className="stat-label">Books</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">450+</span>
                <span className="stat-label">Authors</span>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-column">
            <h3 className="column-title">Explore</h3>
            <ul className="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/browse">Browse Books</a></li>
              <li><a href="/categories">Categories</a></li>
              <li><a href="/authors">Authors</a></li>
              <li><a href="/new-releases">New Releases</a></li>
              <li><a href="/about">About Us</a></li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="footer-column">
            <h3 className="column-title">Account</h3>
            <ul className="footer-links">
              <li><a href="/login">Sign In</a></li>
              <li><a href="/register">Create Account</a></li>
              <li><a href="/profile">My Profile</a></li>
              <li><a href="/library">My Library</a></li>
              <li><a href="/favorites">Favorites</a></li>
              <li><a href="/reading-history">Reading History</a></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="footer-column footer-newsletter">
            <h3 className="column-title">Stay Connected</h3>
            <p className="newsletter-desc">
              Get updates on new books, author spotlights, and literary events in Nepal.
            </p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <div className="newsletter-input-group">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  Subscribe
                </button>
              </div>
              <p className="newsletter-note">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </form>
            
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Kathmandu, Nepal</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>hello@pustakyatra.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="copyright">
              © {new Date().getFullYear()} Pustakyatra. All rights reserved.
            </p>
          </div>
          <div className="footer-bottom-right">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
