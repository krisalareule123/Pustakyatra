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
            <article key={author.author_id} style={{
              background: "white",
              borderRadius: 18,
              padding: "32px 28px 24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.07)"; }}
            >
              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg,#3b5723,#527a30)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 26, fontWeight: 800,
                boxShadow: "0 4px 14px rgba(59,87,35,0.35)",
                marginBottom: 16, flexShrink: 0, position: "relative"
              }}>
                {initials(author.full_name)}
                {/* Verified dot */}
                <span style={{
                  position: "absolute", bottom: 2, right: 2,
                  width: 16, height: 16, borderRadius: "50%",
                  background: "#22c55e", border: "2px solid white",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }} />
              </div>

              {/* Name + label */}
              <div style={{ marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a2912", lineHeight: 1.3 }}>
                  {author.full_name}
                </h3>
                <span style={{
                  display: "inline-block", marginTop: 4,
                  fontSize: 11, fontWeight: 600, color: "#3b5723",
                  background: "#edf5e8", padding: "2px 10px", borderRadius: 20,
                  letterSpacing: 0.5, textTransform: "uppercase"
                }}>Author</span>
              </div>

              {/* Bio — 1 line truncated */}
              {author.bio ? (
                <p style={{
                  margin: "10px 0 0", fontSize: 13, color: "#777",
                  lineHeight: 1.5, maxWidth: 220,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                }}>{author.bio}</p>
              ) : (
                <p style={{ margin: "10px 0 0", fontSize: 13, color: "#bbb", fontStyle: "italic" }}>
                  Nepali author on Pustakyatra
                </p>
              )}

              {/* Stats */}
              <div style={{
                display: "flex", gap: 24, margin: "18px 0",
                padding: "14px 20px", background: "#f7faf5",
                borderRadius: 12, width: "100%", justifyContent: "center"
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1a2912" }}>{author.book_count}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Books</div>
                </div>
              </div>

              {/* Button */}
              <Link to={`/browse?authorId=${author.author_id}`} style={{
                display: "block", width: "100%", padding: "11px 0",
                background: "#3b5723", color: "white", borderRadius: 10,
                fontWeight: 700, fontSize: 14, textDecoration: "none",
                textAlign: "center", transition: "background 0.18s",
                boxSizing: "border-box"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#2d4419"}
                onMouseLeave={e => e.currentTarget.style.background = "#3b5723"}
              >
                View Books
              </Link>
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
