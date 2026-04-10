import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Pages.css";

const API = "http://localhost:5001/api/books";

const mainCategories = [
  {
    name: "Contemporary Fiction",
    description: "Modern stories reflecting today's Nepal",
    icon: "📖",
    color: "#2E8B57",
    featured: ["Summer Love", "Ijoriya"],
    browse: "Fiction",
  },
  {
    name: "Poetry & Literature",
    description: "Beautiful verses from Nepal's finest poets",
    icon: "🪶",
    color: "#4682B4",
    featured: ["Muna Madan"],
    browse: "Poetry",
  },
  {
    name: "Self-Help",
    description: "Wisdom and guidance for personal growth",
    icon: "💡",
    color: "#9370DB",
    featured: ["Test Data"],
    browse: "Self-Help",
  },
  {
    name: "Historical Works",
    description: "Chronicles of Nepal's rich past and culture",
    icon: "🏛️",
    color: "#CD853F",
    featured: [],
    browse: "History",
  },
  {
    name: "Philosophy & Spirituality",
    description: "Wisdom and spiritual insights from Nepali thinkers",
    icon: "🧘",
    color: "#9370DB",
    featured: [],
    browse: "Philosophy",
  },
  {
    name: "Children & Young Adult",
    description: "Stories that inspire and educate young minds",
    icon: "🌟",
    color: "#FF6347",
    featured: [],
    browse: "Children",
  },
];

const quickCategories = [
  "Romance", "Adventure", "Biography", "Science", "Travel", "Cooking",
  "Art", "Music", "Politics", "Economics", "Health", "Technology"
];

export default function Categories() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetch(`${API}?status=published`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        const map = {};
        d.books.forEach(b => {
          const cat = b.category || "";
          if (cat) map[cat] = (map[cat] || 0) + 1;
        });
        setCounts(map);
      })
      .catch(() => {});
  }, []);

  const goTo = (cat) => navigate(`/browse?category=${encodeURIComponent(cat)}`);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="categories-hero">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🗂️</span>
            Explore Categories
          </div>
          <h1 className="hero-title">
            Find Books by <span className="title-highlight">Genre</span>
          </h1>
          <p className="hero-subtitle">
            Browse our carefully organized collection. From timeless classics to contemporary
            works, discover books that match your interests and reading preferences.
          </p>
          <div className="hero-actions">
            <Link to="/browse" className="btn-primary">
              Browse All Books
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </Link>
            <Link to="/authors" className="btn-outline">Meet Authors</Link>
          </div>
        </div>
      </section>

      {/* Main Categories */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">Main Categories</h2>
          <p className="section-subtitle">Explore our most popular book collections</p>
        </div>

        <div className="categories-grid">
          {mainCategories.map((category) => {
            const bookCount = counts[category.browse] || counts[category.name] || 0;
            return (
              <div key={category.name} className="category-tile"
                style={{ cursor: "pointer" }} onClick={() => goTo(category.browse)}>
                <div className="category-header">
                  <div className="category-icon"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                    {category.icon}
                  </div>
                  <div className="category-count">
                    {bookCount > 0 ? `${bookCount} books` : ""}
                  </div>
                </div>

                <div className="category-content">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>

                  {category.featured.length > 0 && (
                    <div className="category-featured">
                      <span className="featured-label">Popular:</span>
                      <div className="featured-books">
                        {category.featured.map((book, index) => (
                          <span key={index} className="featured-book">{book}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="category-footer">
                  <button className="category-btn"
                    onClick={e => { e.stopPropagation(); goTo(category.browse); }}>
                    Explore Collection
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Categories */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">Quick Browse</h2>
          <p className="section-subtitle">Jump to specific topics and themes</p>
        </div>
        <div className="quick-categories">
          {quickCategories.map((category) => (
            <button key={category} className="quick-category" onClick={() => goTo(category)}>
              {category}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Collection */}
      <section className="content-section">
        <div className="featured-collection">
          <div className="collection-content">
            <div className="collection-badge">Editor's Choice</div>
            <h2 className="collection-title">Nepali Literature Essentials</h2>
            <p className="collection-description">
              A curated selection of must-read books that define Nepali literature.
              Perfect for readers new to Nepali books or those looking to explore the classics.
            </p>
            <div className="collection-stats">
              <div className="stat">
                <span className="stat-number">{Object.values(counts).reduce((a, b) => a + b, 0) || "—"}</span>
                <span className="stat-label">Published Books</span>
              </div>
              <div className="stat">
                <span className="stat-number">{Object.keys(counts).length || "—"}</span>
                <span className="stat-label">Categories</span>
              </div>
            </div>
            <div className="collection-actions">
              <button className="btn-primary" onClick={() => navigate("/browse")}>
                View All Books
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>
          <div className="collection-visual">
            <div className="collection-books">
              <div className="book-stack book-1"></div>
              <div className="book-stack book-2"></div>
              <div className="book-stack book-3"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
