import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

const API = "http://localhost:5001/api";

const COLORS = [
  "linear-gradient(135deg,#3b5723,#4a6b2a)",
  "linear-gradient(135deg,#2d4a1a,#3b5723)",
  "linear-gradient(135deg,#4a6b2a,#5a8234)",
  "linear-gradient(135deg,#1a2912,#2d4a1a)",
  "linear-gradient(135deg,#5a8234,#6b9142)",
];

const initials = (title) =>
  title ? title.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") : "?";

function CoverCard({ book, badge, index }) {
  return (
    <Link to={`/book/${book.book_id}`} className="coverCard" title={book.title}>
      <div className="coverTop" style={{ background: COLORS[index % COLORS.length] }}>
        <div className="coverBadge">{badge || initials(book.title)}</div>
        <div className="coverPattern">
          <div className="patternLine"></div>
          <div className="patternLine"></div>
          <div className="patternLine"></div>
          <div className="patternDot"></div>
        </div>
      </div>
      <div className="coverText">
        <div className="coverTitle">{book.title}</div>
        <div className="coverSub">{book.author_name || "Unknown Author"}</div>
      </div>
    </Link>
  );
}

const categories = [
  { name: "Nepali Classics", icon: "📚" },
  { name: "Romance", icon: "💖" },
  { name: "Poems", icon: "🪶" },
  { name: "Self-Help", icon: "🌱" },
  { name: "Exam Prep", icon: "📝" },
  { name: "New Arrivals", icon: "✨" },
];

export default function Home() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    fetch(`${API}/books`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data.success) setBooks(data.books);
        else setFetchError(data.message || "Failed to load books");
      })
      .catch(e => {
        console.error("Books fetch error:", e);
        setFetchError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      <main className="container">
        {/* HERO */}
        <section className="hero">
          <div className="heroContent">
            <div className="heroLeft">
              <div className="pill">
                <span className="pillIcon">📚</span>
                PUSTAKYATRA • Nepali Digital Library
              </div>
              <h1 className="heroTitle">
                Discover the beauty of <br />
                <span className="gradient-text">Nepali literature</span>
              </h1>
              <p className="heroDesc">
                Immerse yourself in Nepal's rich literary heritage. From timeless classics
                to contemporary voices, explore books that celebrate our culture, language, and stories.
              </p>
              <div className="heroActions">
                <button className="btnPrimary" type="button" onClick={() => navigate("/browse")}>
                  <span>Browse Books</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="btnSecondary" type="button" onClick={() => navigate("/register")}>
                  Join Free
                </button>
              </div>
            </div>

            <div className="heroRight">
              <div className="coversShowcase">
                <div className="coverStack" aria-hidden="true">
                  <div className="heroCover left2" />
                  <div className="heroCover left1" />
                  <div className="heroCover center" />
                  <div className="heroCover right1" />
                  <div className="heroCover right2" />
                </div>
                <div className="showcaseGlow"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <h2>Explore by Genre</h2>
              <p className="sectionSubtitle">Discover books across diverse categories</p>
            </div>
            <Link to="/browse" className="linkBtn">
              View All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
          <div className="catGrid">
            {categories.map((c) => (
              <Link key={c.name} to={`/browse?category=${encodeURIComponent(c.name)}`} className="catCard">
                <div className="catIcon">{c.icon}</div>
                <div className="catContent">
                  <div className="catName">{c.name}</div>
                  <div className="catAction">Explore →</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <h2>Recently Added</h2>
              <p className="sectionSubtitle">Fresh additions to our digital collection</p>
            </div>
            <Link to="/browse" className="linkBtn">View All Books</Link>
          </div>

          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>
              <p>Loading books...</p>
            </div>
          ) : fetchError ? (
            <div style={{ padding: "24px", background: "#f8d7da", borderRadius: 8, color: "#721c24" }}>
              <p>Could not load books: {fetchError}</p>
              <p style={{ fontSize: 13 }}>Make sure the backend server is running on port 5001.</p>
            </div>
          ) : books.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#888" }}>
              <p style={{ fontSize: 16 }}>No books available yet. Authors are uploading soon!</p>
              <Link to="/browse" style={{ color: "#3b5723", fontWeight: 600 }}>Browse</Link>
            </div>
          ) : (
            <div className="booksRow">
              {books.map((book, i) => (
                <div key={book.book_id} className="bookItem">
                  <CoverCard book={book} badge="NEW" index={i} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reader Favorites — same books, different badge */}
        {books.length > 0 && (
          <section className="section">
            <div className="sectionHeader">
              <div className="sectionTitle">
                <h2>Reader Favorites</h2>
                <p className="sectionSubtitle">Most loved books by our community</p>
              </div>
              <Link to="/browse" className="linkBtn">View All</Link>
            </div>
            <div className="booksRow">
              {[...books].reverse().map((book, i) => (
                <div key={book.book_id} className="bookItem">
                  <CoverCard book={book} badge="★" index={i} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="ctaSection">
          <div className="ctaCard">
            <div className="ctaContent">
              <div className="ctaIcon">✨</div>
              <h3>Join Our Literary Community</h3>
              <p>
                Whether you're here to discover your next favorite book or share your own stories,
                Pustakyatra welcomes you to Nepal's premier digital library.
              </p>
              <div className="ctaActions">
                <button className="btnPrimary" type="button" onClick={() => navigate("/register")}>
                  <span>Start Your Journey</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="btnSecondary" type="button" onClick={() => navigate("/register")}>
                  For Authors
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
