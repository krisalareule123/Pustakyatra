import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBookById, mockBooks } from "../data/mockBooks";
import "./Pages.css";

export default function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = getBookById(id);
  
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [selectedOption, setSelectedOption] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [rentTimeLeft, setRentTimeLeft] = useState(14); // Demo: 14 days left

  // Demo countdown effect
  useEffect(() => {
    if (selectedOption === "rent") {
      const interval = setInterval(() => {
        setRentTimeLeft(prev => Math.max(0, prev - 0.01)); // Slow countdown for demo
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedOption]);

  // If book not found, show error
  if (!book) {
    return (
      <div className="pageWrap">
        <div className="bookNotFound">
          <h1>Book Not Found</h1>
          <p>The book you're looking for doesn't exist.</p>
          <Link to="/browse" className="btnPrimary">
            Browse All Books
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    const action = selectedOption === "buy" ? "purchased" : "rented";
    alert(`Book ${action} successfully! (Demo)`);
  };

  const progressPercentage = (rentTimeLeft / book.rentDays) * 100;
  const relatedBooks = mockBooks.filter(b => b.id !== book.id).slice(0, 5);

  // Generate placeholder cover with book initials and colors
  const getPlaceholderCover = (book, isSmall = false) => {
    const initials = book.title
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
    
    const colors = [
      'linear-gradient(135deg, #3b5723 0%, #4a6b2a 100%)',
      'linear-gradient(135deg, #2d4a1a 0%, #3b5723 100%)',
      'linear-gradient(135deg, #4a6b2a 0%, #5a8234 100%)',
      'linear-gradient(135deg, #1a2912 0%, #2d4a1a 100%)',
      'linear-gradient(135deg, #5a8234 0%, #6b9142 100%)',
      'linear-gradient(135deg, #2d4a1a 0%, #4a6b2a 100%)'
    ];
    
    const colorIndex = book.id % colors.length;
    const size = isSmall ? '60px' : '100%';
    const fontSize = isSmall ? '14px' : '32px';
    
    return (
      <div 
        className="book-placeholder-cover"
        style={{
          background: colors[colorIndex],
          width: size,
          height: isSmall ? '80px' : '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: fontSize,
          fontWeight: '700',
          borderRadius: isSmall ? '8px' : '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            height: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px'
          }}
        />
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            right: '10px',
            height: '40px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isSmall ? '10px' : '14px',
            fontWeight: '500'
          }}
        >
          {book.nepaliTitle || book.title}
        </div>
        <span style={{ zIndex: 2 }}>{initials}</span>
      </div>
    );
  };

  return (
    <div className="pageWrap">
      {/* Breadcrumb */}
      <div className="ijoriya-breadcrumb">
        <Link to="/">Home</Link>
        <span>›</span>
        <Link to="/browse">Browse</Link>
        <span>›</span>
        <span>{book.title}</span>
      </div>

      <div className="ijoriya-container">
        {/* Left Side - Cover & Thumbnails */}
        <div className="ijoriya-left">
          <div className="ijoriya-cover-section">
            <div className="ijoriya-main-cover">
              {getPlaceholderCover(book)}
            </div>
            
            <div className="ijoriya-thumbnails">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  className={`ijoriya-thumb ${selectedThumbnail === index ? 'active' : ''}`}
                  onClick={() => setSelectedThumbnail(index)}
                >
                  {getPlaceholderCover(book, true)}
                </button>
              ))}
            </div>
          </div>

          {/* All Editions Section */}
          <div className="ijoriya-editions">
            <h3>All Editions</h3>
            <div className="ijoriya-edition-card">
              <div style={{ width: '50px', height: '70px' }}>
                {getPlaceholderCover(book, true)}
              </div>
              <div className="ijoriya-edition-info">
                <div className="ijoriya-edition-type">E-book, Digital Edition</div>
                <div className="ijoriya-edition-details">
                  <div>ISBN-13: 978{book.id}9937746{book.id}95</div>
                  <div>Pustakyatra, 2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Book Info */}
        <div className="ijoriya-right">
          {/* Book Header */}
          <div className="ijoriya-header">
            <h1 className="ijoriya-title">{book.title}</h1>
            <h2 className="ijoriya-nepali-title">{book.nepaliTitle}</h2>
            <div className="ijoriya-author">
              by <Link to={`/authors/${book.author.replace(/\s+/g, '-').toLowerCase()}`}>
                {book.author}
              </Link>
            </div>

            {/* Rating & Categories */}
            <div className="ijoriya-meta">
              <div className="ijoriya-rating">
                <div className="ijoriya-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < Math.floor(book.rating) ? 'filled' : ''}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="ijoriya-rating-text">{book.rating}</span>
              </div>

              <div className="ijoriya-categories">
                {book.categories?.map((category, index) => (
                  <span key={index} className="ijoriya-category">{category}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Purchase Cards */}
          <div className="ijoriya-purchase-section">
            <div className="ijoriya-purchase-cards">
              {/* Buy Card */}
              <div className={`ijoriya-purchase-card ${selectedOption === 'buy' ? 'selected' : ''}`}>
                <div className="ijoriya-card-header">
                  <h3>E-book</h3>
                  <div className="ijoriya-price">Rs {book.buyPrice}</div>
                </div>
                <div className="ijoriya-card-subtitle">Lifetime Access</div>
                <div className="ijoriya-card-actions">
                  <div className="ijoriya-quantity">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                  <button 
                    className="ijoriya-add-btn"
                    onClick={() => {
                      setSelectedOption('buy');
                      handleAddToCart();
                    }}
                  >
                    Add to cart
                  </button>
                </div>
                <button className="ijoriya-read-now">Read now</button>
              </div>

              {/* Rent Card */}
              <div className={`ijoriya-purchase-card ${selectedOption === 'rent' ? 'selected' : ''}`}>
                <div className="ijoriya-card-header">
                  <h3>E-book (Rent)</h3>
                  <div className="ijoriya-price">Rs {book.rentPrice}</div>
                </div>
                <div className="ijoriya-card-subtitle">{book.rentDays} days access</div>
                
                {selectedOption === 'rent' && (
                  <div className="ijoriya-rent-status">
                    <div className="ijoriya-time-left">
                      {Math.floor(rentTimeLeft)} days left
                    </div>
                    <div className="ijoriya-progress-bar">
                      <div 
                        className="ijoriya-progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="ijoriya-card-actions">
                  <div className="ijoriya-quantity">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                  <button 
                    className="ijoriya-add-btn"
                    onClick={() => {
                      setSelectedOption('rent');
                      handleAddToCart();
                    }}
                  >
                    Add to cart
                  </button>
                </div>
                <button className="ijoriya-rent-now">Rent now</button>
              </div>
            </div>
          </div>

          {/* Nominations */}
          {book.nominations && book.nominations.length > 0 && (
            <div className="ijoriya-nominations">
              <h3>Nominations</h3>
              <div className="ijoriya-nominations-list">
                {book.nominations.map((nomination, index) => (
                  <span key={index} className="ijoriya-nomination">{nomination}</span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="ijoriya-description">
            <div className="ijoriya-desc-english">
              <p>{book.descriptionEn}</p>
            </div>
            
            <div className="ijoriya-desc-nepali">
              <h4>नेपालीमा विवरण</h4>
              <p>{book.descriptionNp}</p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="ijoriya-reviews">
            <div className="ijoriya-reviews-header">
              <h3>Reader Reviews</h3>
              <div className="ijoriya-review-summary">
                <div className="ijoriya-review-score">{book.rating}</div>
                <div className="ijoriya-review-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < Math.floor(book.rating) ? 'filled' : ''}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ijoriya-review-form">
              <h4>Share Your Thoughts</h4>
              <p>Your review helps others make informed decisions</p>
              <div className="ijoriya-review-stars-input">
                {[...Array(5)].map((_, i) => (
                  <button key={i} className="star-btn">★</button>
                ))}
              </div>
              <p>Click on a star to start your review</p>
            </div>

            <div className="ijoriya-sample-reviews">
              {book.userReviews && book.userReviews.length > 0 ? (
                book.userReviews.map((review) => (
                  <div key={review.id} className="ijoriya-review">
                    <div className="ijoriya-reviewer">
                      <div className="ijoriya-reviewer-avatar">{review.reviewerAvatar}</div>
                      <div className="ijoriya-reviewer-info">
                        <div className="ijoriya-reviewer-name">{review.reviewerName}</div>
                        <div className="ijoriya-review-date">{review.date}</div>
                        <div className="ijoriya-review-stars">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`star ${i < review.rating ? 'filled' : ''}`}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ijoriya-review-text">
                      {review.reviewText}
                    </div>
                  </div>
                ))
              ) : (
                <div className="ijoriya-no-reviews">
                  <p>No reviews yet. Be the first to review this book!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Books */}
      <div className="ijoriya-related">
        <h3>Related Books</h3>
        <div className="ijoriya-related-grid">
          {relatedBooks.map((relatedBook) => (
            <Link key={relatedBook.id} to={`/book/${relatedBook.id}`} className="ijoriya-related-book">
              <div style={{ width: '100%', height: '200px' }}>
                {getPlaceholderCover(relatedBook)}
              </div>
              <div className="ijoriya-related-info">
                <div className="ijoriya-related-title">{relatedBook.title}</div>
                <div className="ijoriya-related-author">{relatedBook.author}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}