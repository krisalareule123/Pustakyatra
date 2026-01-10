import { Link } from "react-router-dom";
import "./Pages.css";

const books = [
  { 
    id: 1, 
    title: "Basain", 
    author: "Lil Bahadur Chettri", 
    category: "Classic", 
    year: "1957", 
    rating: 4.8,
    pages: 280,
    language: "Nepali"
  },
  { 
    id: 2, 
    title: "Muna Madan", 
    author: "Laxmi Prasad Devkota", 
    category: "Poetry", 
    year: "1936", 
    rating: 4.9,
    pages: 156,
    language: "Nepali"
  },
  { 
    id: 3, 
    title: "Palpasa Café", 
    author: "Narayan Wagle", 
    category: "Novel", 
    year: "2005", 
    rating: 4.6,
    pages: 312,
    language: "Nepali"
  },
  { 
    id: 4, 
    title: "Sirishko Phool", 
    author: "Parijat", 
    category: "Classic", 
    year: "1965", 
    rating: 4.7,
    pages: 198,
    language: "Nepali"
  },
  { 
    id: 5, 
    title: "Karnali Blues", 
    author: "Buddhisagar", 
    category: "Contemporary", 
    year: "2010", 
    rating: 4.5,
    pages: 245,
    language: "Nepali"
  },
  { 
    id: 6, 
    title: "Seto Dharati", 
    author: "Amar Neupane", 
    category: "Novel", 
    year: "2008", 
    rating: 4.4,
    pages: 289,
    language: "Nepali"
  }
];

const categories = ["All Books", "Classics", "Novels", "Poetry", "Contemporary"];
const sortOptions = ["Popular", "Newest", "Rating", "A-Z"];

export default function Browse() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="browse-hero">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">📖</span>
            Discover Literature
          </div>
          <h1 className="hero-title">
            Browse Our <span className="title-highlight">Digital Collection</span>
          </h1>
          <p className="hero-subtitle">
            Explore thousands of Nepali books, from timeless classics to contemporary masterpieces. 
            Find your next great read in our carefully curated digital library.
          </p>
          
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-box">
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search by title, author, or ISBN..."
                className="search-input"
              />
              <button className="search-btn">Search</button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">2,500+</span>
              <span className="stat-label">Books</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">450+</span>
              <span className="stat-label">Authors</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">12k+</span>
              <span className="stat-label">Readers</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="filters-section">
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="filter-tabs">
              {categories.map((category, index) => (
                <button 
                  key={category} 
                  className={`filter-tab ${index === 0 ? 'active' : ''}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Sort by</label>
            <select className="filter-select">
              {sortOptions.map(option => (
                <option key={option} value={option.toLowerCase()}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">Featured Books</h2>
          <p className="section-subtitle">Discover the most loved books in our collection</p>
        </div>

        <div className="books-grid">
          {books.map((book) => (
            <article key={book.id} className="book-card">
              <div className="book-cover">
                <div className="cover-placeholder">
                  <div className="cover-pattern"></div>
                  <span className="cover-initials">{book.title.slice(0, 2)}</span>
                </div>
                <div className="book-badge">{book.category}</div>
              </div>
              
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                
                <div className="book-meta">
                  <div className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span>{book.rating}</span>
                  </div>
                  <div className="meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>{book.pages}p</span>
                  </div>
                  <div className="meta-item">
                    <span>{book.year}</span>
                  </div>
                </div>

                <div className="book-actions">
                  <button className="btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Preview
                  </button>
                  <button className="btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Save
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="load-more">
          <button className="btn-outline">
            Load More Books
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7l7 7 7-7" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
}