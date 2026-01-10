import { Link } from "react-router-dom";
import "./Pages.css";

const featuredAuthors = [
  {
    id: 1,
    name: "Laxmi Prasad Devkota",
    title: "Mahakavi (Great Poet)",
    bio: "The Shakespeare of Nepali literature, renowned for his epic poem Muna Madan and countless other literary masterpieces.",
    era: "1909-1959",
    books: 25,
    followers: 15420,
    rating: 4.9,
    genres: ["Poetry", "Epic", "Drama"],
    achievements: ["Tribhuvan Puraskar", "Literary Icon"],
    isVerified: true
  },
  {
    id: 2,
    name: "Parijat",
    title: "Pioneering Novelist",
    bio: "Groundbreaking female author known for psychological depth and social commentary in works like Sirishko Phool.",
    era: "1937-1993",
    books: 12,
    followers: 8750,
    rating: 4.7,
    genres: ["Fiction", "Psychology", "Social"],
    achievements: ["Madan Puraskar", "Feminist Icon"],
    isVerified: true
  },
  {
    id: 3,
    name: "Narayan Wagle",
    title: "Contemporary Voice",
    bio: "Modern storyteller capturing the essence of contemporary Nepali society through compelling narratives.",
    era: "1962-Present",
    books: 8,
    followers: 12300,
    rating: 4.6,
    genres: ["Contemporary", "Social", "Romance"],
    achievements: ["Madan Puraskar Winner"],
    isVerified: true
  },
  {
    id: 4,
    name: "Buddhisagar",
    title: "Popular Novelist",
    bio: "Beloved contemporary author known for engaging storytelling and relatable characters in modern Nepal.",
    era: "1974-Present",
    books: 15,
    followers: 20100,
    rating: 4.5,
    genres: ["Fiction", "Contemporary", "Drama"],
    achievements: ["Bestselling Author"],
    isVerified: true
  },
  {
    id: 5,
    name: "Krishna Dharabasi",
    title: "Literary Critic & Novelist",
    bio: "Acclaimed writer and critic known for thought-provoking narratives and insightful literary analysis.",
    era: "1955-Present",
    books: 18,
    followers: 9200,
    rating: 4.4,
    genres: ["Fiction", "Criticism", "Essays"],
    achievements: ["Padmashree Award"],
    isVerified: true
  },
  {
    id: 6,
    name: "Manjushree Thapa",
    title: "Bilingual Author",
    bio: "Versatile writer bridging Nepali and English literature with powerful storytelling and cultural insights.",
    era: "1968-Present",
    books: 10,
    followers: 7800,
    rating: 4.3,
    genres: ["Fiction", "Non-fiction", "Translation"],
    achievements: ["International Recognition"],
    isVerified: false
  }
];

const authorCategories = ["All Authors", "Classical", "Contemporary", "Poets", "Novelists", "Critics"];

export default function Authors() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="authors-hero">
        <div className="hero-background">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✍️</span>
            Literary Voices
          </div>
          <h1 className="hero-title">
            Meet Nepali <span className="title-highlight">Authors</span>
          </h1>
          <p className="hero-subtitle">
            Discover the brilliant minds behind Nepal's literary treasures. From legendary poets 
            to contemporary novelists, explore their works and contributions to Nepali literature.
          </p>
          
          <div className="hero-actions">
            <Link to="/browse" className="btn-primary">
              Browse Their Books
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </Link>
            <Link to="/categories" className="btn-outline">
              Explore Genres
            </Link>
          </div>

          {/* Author Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">450+</span>
              <span className="stat-label">Authors</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">2.5k+</span>
              <span className="stat-label">Books</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Awards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="filters-section">
        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="filter-tabs">
              {authorCategories.map((category, index) => (
                <button 
                  key={category} 
                  className={`filter-tab ${index === 0 ? 'active' : ''}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Authors Grid */}
      <section className="content-section">
        <div className="section-header">
          <h2 className="section-title">Featured Authors</h2>
          <p className="section-subtitle">Literary voices that have shaped Nepali culture</p>
        </div>

        <div className="authors-grid">
          {featuredAuthors.map((author) => (
            <article key={author.id} className="author-card">
              <div className="author-header">
                <div className="author-avatar">
                  <span className="avatar-initials">
                    {author.name.split(' ').map(n => n[0]).join('')}
                  </span>
                  {author.isVerified && (
                    <div className="verified-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="author-rating">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>{author.rating}</span>
                </div>
              </div>

              <div className="author-info">
                <h3 className="author-name">{author.name}</h3>
                <p className="author-title">{author.title}</p>
                <p className="author-era">{author.era}</p>
                <p className="author-bio">{author.bio}</p>

                <div className="author-genres">
                  {author.genres.map((genre) => (
                    <span key={genre} className="genre-tag">{genre}</span>
                  ))}
                </div>

                <div className="author-stats">
                  <div className="stat-group">
                    <div className="stat">
                      <span className="stat-number">{author.books}</span>
                      <span className="stat-label">Books</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{(author.followers / 1000).toFixed(1)}k</span>
                      <span className="stat-label">Followers</span>
                    </div>
                  </div>
                </div>

                <div className="author-achievements">
                  <span className="achievements-label">Recognition:</span>
                  <div className="achievements-list">
                    {author.achievements.map((achievement, index) => (
                      <span key={index} className="achievement">{achievement}</span>
                    ))}
                  </div>
                </div>

                <div className="author-actions">
                  <button className="btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    View Profile
                  </button>
                  <button className="btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    View Books
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="load-more">
          <button className="btn-outline">
            Discover More Authors
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7l7 7 7-7" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Author Spotlight */}
      <section className="content-section">
        <div className="author-spotlight">
          <div className="spotlight-content">
            <div className="spotlight-badge">Author Spotlight</div>
            <h2 className="spotlight-title">Become a Published Author</h2>
            <p className="spotlight-description">
              Join our community of Nepali authors and share your stories with thousands of readers. 
              Our platform provides all the tools you need to publish, promote, and monetize your work.
            </p>
            <div className="spotlight-features">
              <div className="feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Easy Publishing Tools</span>
              </div>
              <div className="feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Built-in Audience</span>
              </div>
              <div className="feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20m8-10H4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Revenue Sharing</span>
              </div>
            </div>
            <div className="spotlight-actions">
              <Link to="/register" className="btn-primary">
                Start Publishing
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </Link>
              <button className="btn-outline">Learn More</button>
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