import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Pages.css";

const API = "http://localhost:5001/api";

const initials = (name) =>
  name ? name.split(" ").map(w => w[0]?.toUpperCase()).join("").slice(0, 2) : "?";

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/authors/public`)
      .then(r => r.json())
      .then(data => { if (data.success) setAuthors(data.authors); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <section className="authors-hero">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge"><span className="badge-icon">✍️</span>Literary Voices</div>
          <h1 className="hero-title">Meet Nepali <span className="title-highlight">Authors</span></h1>
          <p className="hero-subtitle">
            Discover the real authors publishing on Pustakyatra. Explore their books and support Nepali literature.
          </p>
          <div className="hero-actions">
            <Link to="/browse" className="btn-primary">
              Browse Their Books
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">
            {loading ? "Loading..." : `${authors.length} Author${authors.length !== 1 ? "s" : ""} on Pustakyatra`}
          </h2>
          <p className="section-subtitle">Real authors publishing real books</p>
        </div>

        {!loading && authors.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
            <p style={{ fontSize: 18 }}>No authors yet. Be the first to join!</p>
            <Link to="/register" style={{ color: "#3b5723", fontWeight: 600 }}>Register as Author</Link>
          </div>
        )}

        <div className="authors-grid">
          {authors.map((author) => (
            <article key={author.author_id} className="author-card">
              <div className="author-header">
                <div className="author-avatar">
                  <span className="avatar-initials">{initials(author.full_name)}</span>
                  <div className="verified-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="author-info">
                <h3 className="author-name">{author.full_name}</h3>

                {author.bio && (
                  <p className="author-bio" style={{ marginBottom: 12 }}>{author.bio}</p>
                )}

                <div className="author-stats">
                  <div className="stat-group">
                    <div className="stat">
                      <span className="stat-number">{author.book_count}</span>
                      <span className="stat-label">Books</span>
                    </div>
                  </div>
                </div>

                <div className="author-actions">
                  <Link to={`/browse?authorId=${author.author_id}`} className="btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    View Books
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA for new authors */}
      <section className="content-section">
        <div className="author-spotlight">
          <div className="spotlight-content">
            <div className="spotlight-badge">Join Us</div>
            <h2 className="spotlight-title">Become a Published Author</h2>
            <p className="spotlight-description">
              Share your stories with readers across Nepal. Register as an author, upload your books, and start earning.
            </p>
            <div className="spotlight-actions">
              <Link to="/register" className="btn-primary">
                Start Publishing
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </Link>
            </div>
          </div>
          <div className="spotlight-visual">
            <div className="visual-elements">
              <div className="element element-1"></div>
              <div className="element element-2"></div>
              <div className="element element-3"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
