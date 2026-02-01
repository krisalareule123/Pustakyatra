import { Link } from "react-router-dom";
import { mockBooks } from "../data/mockBooks";
import "./Home.css";

const categories = [
  { name: "Nepali Classics", icon: "📚" },
  { name: "Romance", icon: "💖" },
  { name: "Poems", icon: "🪶" },
  { name: "Self-Help", icon: "🌱" },
  { name: "Exam Prep", icon: "📝" },
  { name: "New Arrivals", icon: "✨" },
];

function CoverCard({ book, badge }) {
  const initials = book.title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <Link to={`/book/${book.id}`} className="coverCard" title={book.title}>
      <div className="coverTop">
        <div className="coverBadge">{badge || initials}</div>
        <div className="coverPattern">
          <div className="patternLine"></div>
          <div className="patternLine"></div>
          <div className="patternLine"></div>
          <div className="patternDot"></div>
        </div>
      </div>

      <div className="coverText">
        <div className="coverTitle">{book.title}</div>
        <div className="coverSub">{book.author}</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const topRow = mockBooks.slice(0, 6);
  const recent = mockBooks.slice(0, 8);
  const best = [...mockBooks].reverse().slice(0, 8);

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
                to contemporary voices, explore thousands of books that celebrate our 
                culture, language, and stories.
              </p>

              <div className="heroActions">
                <button className="btnPrimary" type="button">
                  <span>Start Reading</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="btnSecondary" type="button">
                  Browse Collection
                </button>
              </div>

              <div className="stats">
                <div className="statCard">
                  <div className="statNum">12,000+</div>
                  <div className="statLabel">Active Readers</div>
                </div>
                <div className="statCard">
                  <div className="statNum">2,500+</div>
                  <div className="statLabel">Digital Books</div>
                </div>
                <div className="statCard">
                  <div className="statNum">450+</div>
                  <div className="statLabel">Authors</div>
                </div>
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

  <div className="heroNote">
    <span className="noteIcon">💡</span>
    Book covers will be replaced with actual imagery
  </div>
</div>

          </div>
        </section>

        {/* Featured Categories */}
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <h2>Explore by Genre</h2>
              <p className="sectionSubtitle">Discover books across diverse categories</p>
            </div>
            <button className="linkBtn" type="button">
              View All Categories
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="catGrid">
            {categories.map((c, index) => (
              <button key={c.name} className="catCard" type="button">
                <div className="catIcon">{c.icon}</div>
                <div className="catContent">
                  <div className="catName">{c.name}</div>
                  <div className="catAction">Explore →</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent E-books */}
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <h2>Recently Added</h2>
              <p className="sectionSubtitle">Fresh additions to our digital collection</p>
            </div>
            <button className="linkBtn" type="button">
              View All Books
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="booksRow">
            {recent.map((book) => (
              <div key={book.id} className="bookItem">
                <CoverCard book={book} badge="NEW" />
              </div>
            ))}
          </div>
        </section>

        {/* Bestsellers */}
        <section className="section">
          <div className="sectionHeader">
            <div className="sectionTitle">
              <h2>Reader Favorites</h2>
              <p className="sectionSubtitle">Most loved books by our community</p>
            </div>
            <button className="linkBtn" type="button">
              View All Favorites
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="booksRow">
            {best.map((book) => (
              <div key={book.id} className="bookItem">
                <CoverCard book={book} badge="★" />
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="ctaSection">
          <div className="ctaCard">
            <div className="ctaContent">
              <div className="ctaIcon">✨</div>
              <h3>Join Our Literary Community</h3>
              <p>
                Whether you're here to discover your next favorite book or share your own stories 
                with the world, Pustakyatra welcomes you to Nepal's premier digital library.
              </p>
              <div className="ctaActions">
                <button className="btnPrimary" type="button">
                  <span>Start Your Journey</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="btnSecondary" type="button">
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
