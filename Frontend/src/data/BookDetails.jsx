import { useMemo, useState } from "react";
import "./pages.css";

// UI-only mock (later replace from backend)
const mockBook = {
  title: "Ijoriya",
  nepaliTitle: "इजोरिया",
  author: "Subin Bhattarai",
  rating: 4.1,
  categories: ["Novels", "Nepali"],
  nominations: ["Padmashree Sahitya Puraskar, 2079 BS", "Madan Puraskar, 2079 BS"],
  aboutEn:
    "There is a multifaceted story in the novel 'Ijoriya'. Author Bhattarai has brought out love, hate and conflict between family members.",
  aboutNp:
    "सुबिन भट्टराईका पाठकलाई थाहै छ—उनी विषय होइन शैली, हर पुस्तकमा नयाँपन दिन्छन् । इजोरिया एउटा भावनात्मक सम्बन्ध–साहित्यको कथा हो।",

  // images
  cover:
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",
  thumbs: [
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&q=80",
    "https://images.unsplash.com/photo-1455885666463-4d7e7d1963ce?w=500&q=80",
  ],

  buyPrice: 245,
  rentPrice: 125, // half-ish
  rentDaysTotal: 15,

  related: [
    { id: 11, title: "Summer Love", img: "https://images.unsplash.com/photo-1522098543979-ffc7f79d5af5?w=900&q=80" },
    { id: 12, title: "कथाकी पात्र", img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=900&q=80" },
    { id: 13, title: "प्रिय सुफी", img: "https://images.unsplash.com/photo-1455885666463-4d7e7d1963ce?w=900&q=80" },
    { id: 14, title: "साया", img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80" },
    { id: 15, title: "मनसुन", img: "https://images.unsplash.com/photo-1473755504818-b72b6dfdc226?w=900&q=80" },
  ],
};

export default function BookDetails() {
  const book = mockBook;

  const [activeImg, setActiveImg] = useState(book.cover);

  // UI demo: pretend user rented and has 14 days left
  const [rentDaysLeft] = useState(14);

  const rentProgress = useMemo(() => {
    const used = book.rentDaysTotal - rentDaysLeft;
    const pct = Math.max(0, Math.min(100, (used / book.rentDaysTotal) * 100));
    return pct;
  }, [rentDaysLeft, book.rentDaysTotal]);

  return (
    <div className="bd-page">
      <div className="bd-shell">
        {/* LEFT: images */}
        <aside className="bd-left">
          <div className="bd-cover">
            <img src={activeImg} alt="Book cover" />
          </div>

          <div className="bd-thumbs">
            {book.thumbs.map((t, i) => (
              <button
                key={i}
                className={`bd-thumb ${activeImg === t ? "isActive" : ""}`}
                onClick={() => setActiveImg(t)}
                type="button"
              >
                <img src={t} alt={`thumb-${i}`} />
              </button>
            ))}
          </div>

          <div className="bd-tags">
            {book.categories.map((c) => (
              <span key={c} className="bd-tag">
                {c}
              </span>
            ))}
          </div>

          <div className="bd-rating">
            <div className="bd-stars" aria-label="rating">
              ★★★★☆
            </div>
            <span className="bd-ratingNum">{book.rating}</span>
          </div>
        </aside>

        {/* RIGHT: info */}
        <main className="bd-main">
          <header className="bd-header">
            <h1 className="bd-title">{book.title}</h1>
            <div className="bd-sub">{book.nepaliTitle}</div>
            <div className="bd-author">by {book.author}</div>
          </header>

          {/* BUY + RENT cards */}
          <section className="bd-buyRow">
            {/* BUY */}
            <div className="bd-card">
              <div className="bd-cardTop">
                <div className="bd-cardTitle">E-book (Buy)</div>
                <span className="bd-pill">Lifetime access</span>
              </div>

              <div className="bd-price">Rs {book.buyPrice}</div>

              <div className="bd-actions">
                <button className="bd-btn bd-btnGhost" type="button">
                  🛒 Add to cart
                </button>
                <button className="bd-btn bd-btnPrimary" type="button">
                  Buy now
                </button>
              </div>

              <button className="bd-btn bd-btnLink" type="button">
                Read now
              </button>
            </div>

            {/* RENT */}
            <div className="bd-card">
              <div className="bd-cardTop">
                <div className="bd-cardTitle">E-book (Rent)</div>
                <span className="bd-pill bd-pillBlue">{book.rentDaysTotal} days</span>
              </div>

              <div className="bd-price">Rs {book.rentPrice}</div>
              <div className="bd-muted">
                Limited-time download • Auto-expire after {book.rentDaysTotal} days
              </div>

              {/* UI-only countdown */}
              <div className="bd-rentBox">
                <div className="bd-rentRow">
                  <span className="bd-rentLabel">Time remaining</span>
                  <span className="bd-rentLeft">{rentDaysLeft} days left</span>
                </div>
                <div className="bd-progress">
                  <div className="bd-progressFill" style={{ width: `${rentProgress}%` }} />
                </div>
              </div>

              <div className="bd-actions">
                <button className="bd-btn bd-btnGhost" type="button">
                  🛒 Add to cart
                </button>
                <button className="bd-btn bd-btnPrimary" type="button">
                  Rent now
                </button>
              </div>

              <div className="bd-note">
                After time ends, this book will disappear from Downloads.
              </div>
            </div>
          </section>

          {/* nominations */}
          <section className="bd-section">
            <h3 className="bd-h3">Nominations</h3>
            <div className="bd-chips">
              {book.nominations.map((n) => (
                <span key={n} className="bd-chip">
                  {n}
                </span>
              ))}
            </div>
          </section>

          {/* descriptions */}
          <section className="bd-section">
            <p className="bd-text">{book.aboutEn}</p>
            <h3 className="bd-h3">पहिलो बाहिरी पृष्ठबाट</h3>
            <p className="bd-text">{book.aboutNp}</p>
          </section>

          {/* reviews */}
          <section className="bd-reviewsRow">
            <div className="bd-reviewCard">
              <div className="bd-reviewIcon">👤</div>
              <h3 className="bd-reviewTitle">Share Your Thoughts</h3>
              <p className="bd-muted">
                Your review helps others make informed decisions
              </p>
              <div className="bd-starsBig">☆ ☆ ☆ ☆ ☆</div>
              <div className="bd-muted">Click on a star to start your review</div>
            </div>

            <div className="bd-reviewList">
              <div className="bd-reviewHead">
                <div>
                  <div className="bd-reviewTitle">Reader Reviews</div>
                  <div className="bd-ratingLine">
                    <span className="bd-ratingBig">{book.rating}</span>
                    <span className="bd-stars">★★★★☆</span>
                  </div>
                </div>
              </div>

              <div className="bd-reviewItems">
                <ReviewItem name="buddhirampandey" date="December 3, 2025" text="good" />
                <ReviewItem name="John Purbachhane" date="November 15, 2025" text="Nice read." />
                <ReviewItem name="Bijay Kc" date="November 4, 2025" text="Loved it." />
              </div>
            </div>
          </section>

          {/* related */}
          <section className="bd-related">
            <h2 className="bd-relatedTitle">Related Books</h2>
            <div className="bd-relatedGrid">
              {book.related.map((b) => (
                <div key={b.id} className="bd-relatedCard">
                  <div className="bd-relatedImg">
                    <img src={b.img} alt={b.title} />
                  </div>
                  <div className="bd-relatedName">{b.title}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function ReviewItem({ name, date, text }) {
  return (
    <div className="bd-reviewItem">
      <div className="bd-avatar">{name[0]?.toUpperCase()}</div>
      <div className="bd-reviewBody">
        <div className="bd-reviewMeta">
          <span className="bd-reviewName">{name}</span>
          <span className="bd-dot">•</span>
          <span className="bd-reviewDate">{date}</span>
        </div>
        <div className="bd-starsSmall">★★★★☆</div>
        <div className="bd-reviewText">{text}</div>
      </div>
    </div>
  );
}
