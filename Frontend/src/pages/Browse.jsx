import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./Pages.css";

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

export default function Browse() {
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);

    fetch(`${API}/books?${params}`)
      .then(r => r.json())
      .then(data => { if (data.success) setBooks(data.books); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div className="page-container">
      <section className="browse-hero">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge"><span className="badge-icon">📖</span>Discover Literature</div>
          <h1 className="hero-title">Browse Our <span className="title-highlight">Digital Collection</span></h1>
          <p className="hero-subtitle">Explore Nepali books from real authors on Pustakyatra.</p>

          <div className="search-container">
            <div className="search-box">
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <input type="text" placeholder="Search by title or author..."
                className="search-input" value={search}
                onChange={e => setSearch(e.target.value)} />
              <button className="search-btn">Search</button>
            </div>
          </div>
        </div>
      </section>

      <section className="filters-section">
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="filter-tabs">
              {["", "Fiction", "Non-Fiction", "Poetry", "Biography", "History", "Self-Help"].map((cat) => (
                <button key={cat} className={`filter-tab ${category === cat ? "active" : ""}`}
                  onClick={() => setCategory(cat)}>
                  {cat || "All Books"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">
            {loading ? "Loading..." : books.length === 0 ? "No books available yet" : `${books.length} Book${books.length !== 1 ? "s" : ""}`}
          </h2>
          {!loading && books.length === 0 && (
            <p className="section-subtitle">Authors are uploading books. Check back soon!</p>
          )}
        </div>

        <div className="books-grid">
          {books.map((book, i) => (
            <Link key={book.book_id} to={`/book/${book.book_id}`} className="book-card">
              <div className="book-cover">
                <div className="cover-placeholder" style={{ background: COLORS[i % COLORS.length] }}>
                  <div className="cover-pattern"></div>
                  <span className="cover-initials">{initials(book.title)}</span>
                </div>
                {book.category && <div className="book-badge">{book.category}</div>}
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author_name || "Unknown Author"}</p>
                <div className="book-meta">
                  <div className="meta-item"><span>Buy Rs {book.buy_price}</span></div>
                  <div className="meta-item"><span>Rent Rs {book.rent_price}</span></div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
