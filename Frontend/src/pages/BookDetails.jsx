import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBookById, mockBooks, getIdFromSlug, generateSlug } from "../data/mockBooks";
import ReviewSection from "../components/ReviewSection";
import "./Pages.css";

export default function BookDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const id = getIdFromSlug(slug);
  const book = getBookById(id);
  
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [rentQuantity, setRentQuantity] = useState(1);
  const [showBuyPayNow, setShowBuyPayNow] = useState(false);
  const [showRentPayNow, setShowRentPayNow] = useState(false);

  // Check if book is in cart and update Pay Now buttons
  useEffect(() => {
    const checkCartStatus = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      if (book) {
        const hasBuyItem = cart.some(item => item.bookId === book.id && item.type === 'buy');
        const hasRentItem = cart.some(item => item.bookId === book.id && item.type === 'rent');
        setShowBuyPayNow(hasBuyItem);
        setShowRentPayNow(hasRentItem);
      }
    };

    // Check on mount and when cart updates
    checkCartStatus();
    
    window.addEventListener('cartUpdated', checkCartStatus);
    window.addEventListener('openCart', checkCartStatus);
    
    return () => {
      window.removeEventListener('cartUpdated', checkCartStatus);
      window.removeEventListener('openCart', checkCartStatus);
    };
  }, [book]);

  const handleAddToCart = (type) => {
    const cartItem = {
      bookId: book.id,
      title: book.title,
      nepaliTitle: book.nepaliTitle,
      author: book.author,
      type: type,
      quantity: type === 'buy' ? buyQuantity : rentQuantity,
      price: type === 'buy' ? book.buyPrice : book.rentPrice,
      totalPrice: type === 'buy' ? book.buyPrice * buyQuantity : book.rentPrice * rentQuantity,
      rentDays: type === 'rent' ? book.rentDays : null
    };

    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = existingCart.findIndex(
      item => item.bookId === book.id && item.type === type
    );

    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += cartItem.quantity;
      existingCart[existingItemIndex].totalPrice = 
        existingCart[existingItemIndex].price * existingCart[existingItemIndex].quantity;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    // Dispatch custom event to update cart count and open cart panel
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('openCart'));
  };

  const getCartTotal = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handlePayNow = (type) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    const item = {
      bookId: book.id,
      title: book.title,
      author: book.author,
      type,
      quantity: type === "buy" ? buyQuantity : rentQuantity,
      price: type === "buy" ? book.buyPrice : book.rentPrice,
      totalPrice: type === "buy" ? book.buyPrice * buyQuantity : book.rentPrice * rentQuantity,
      rentDays: type === "rent" ? book.rentDays : null,
    };
    navigate("/payment", { state: { items: [item], totalAmount: item.totalPrice } });
  };

  const handleCloseCart = () => {
    window.dispatchEvent(new Event('closeCart'));
  };

  if (!book) {
    return (
      <div className="thuprai-page">
        <div className="thuprai-container">
          <div className="book-not-found">
            <h1>Book Not Found</h1>
            <p>The book you're looking for doesn't exist.</p>
            <Link to="/browse" className="btn-primary-thuprai">Browse All Books</Link>
          </div>
        </div>
      </div>
    );
  }

  const relatedBooks = mockBooks.filter(b => b.id !== book.id).slice(0, 5);

  const getPlaceholderCover = (book, size = 'large') => {
    const initials = book.title.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
    const colors = [
      'linear-gradient(135deg, #3b5723 0%, #4a6b2a 100%)',
      'linear-gradient(135deg, #2d4a1a 0%, #3b5723 100%)',
      'linear-gradient(135deg, #4a6b2a 0%, #5a8234 100%)',
      'linear-gradient(135deg, #1a2912 0%, #2d4a1a 100%)',
      'linear-gradient(135deg, #5a8234 0%, #6b9142 100%)',
      'linear-gradient(135deg, #2d4a1a 0%, #4a6b2a 100%)'
    ];
    const colorIndex = book.id % colors.length;
    const dimensions = {
      large: { width: '100%', height: '450px', fontSize: '48px', borderRadius: '8px' },
      medium: { width: '80px', height: '110px', fontSize: '20px', borderRadius: '6px' },
      small: { width: '60px', height: '85px', fontSize: '16px', borderRadius: '4px' }
    };
    const dim = dimensions[size];
    return (
      <div className="book-placeholder-cover" style={{
        background: colors[colorIndex], width: dim.width, height: dim.height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: dim.fontSize, fontWeight: '700',
        borderRadius: dim.borderRadius, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '10px', left: '10px', right: '10px',
          height: size === 'large' ? '20px' : '10px',
          background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px'
        }} />
        <div style={{
          position: 'absolute', bottom: '10px', left: '10px', right: '10px',
          height: size === 'large' ? '40px' : '20px',
          background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size === 'large' ? '14px' : '8px', fontWeight: '500', padding: '0 8px'
        }}>
          {size === 'large' ? (book.nepaliTitle || book.title) : ''}
        </div>
        <span style={{ zIndex: 2 }}>{initials}</span>
      </div>
    );
  };

  return (
    <>
      <div className="thuprai-page">
        <div className="thuprai-container">
          <div className="thuprai-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/browse">Books</Link>
            <span>/</span>
            <span>{book.title}</span>
          </div>

          <div className="thuprai-book-layout">
            <div className="thuprai-book-cover">
              {getPlaceholderCover(book, 'large')}
              <div className="thuprai-thumbnails">
                {[0, 1].map((index) => (
                  <button key={index} className={`thuprai-thumb ${selectedThumbnail === index ? 'active' : ''}`}
                    onClick={() => setSelectedThumbnail(index)}>
                    {getPlaceholderCover(book, 'small')}
                  </button>
                ))}
              </div>
              <div className="thuprai-tags">
                {book.categories?.map((category, index) => (
                  <span key={index} className="thuprai-tag">{category}</span>
                ))}
              </div>
            </div>

            <div className="thuprai-book-info">
              <h1 className="thuprai-book-title">{book.title}</h1>
              <h2 className="thuprai-book-subtitle">{book.nepaliTitle}</h2>
              <div className="thuprai-author">
                by <Link to={`/authors/${book.author.replace(/\s+/g, '-').toLowerCase()}`}>{book.author}</Link>
              </div>
              <div className="thuprai-rating">
                <div className="thuprai-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < Math.floor(book.rating) ? 'filled' : ''}`}>★</span>
                  ))}
                </div>
                <span className="thuprai-rating-text">{book.rating}</span>
              </div>

              <div className="thuprai-purchase-options">
                <div className="thuprai-option-card">
                  <div className="thuprai-option-header">
                    <span className="thuprai-option-type">E-book</span>
                    <span className="thuprai-option-price">Rs {book.buyPrice}</span>
                  </div>
                  {!showBuyPayNow ? (
                    <>
                      <div className="thuprai-option-actions">
                        <div className="thuprai-quantity-selector">
                          <button onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}>-</button>
                          <input type="number" value={buyQuantity} readOnly />
                          <button onClick={() => setBuyQuantity(buyQuantity + 1)}>+</button>
                        </div>
                        <button className="thuprai-btn-add-cart-full" onClick={() => handleAddToCart('buy')}>
                          🛒 Add to cart
                        </button>
                      </div>
                    </>
                  ) : (
                    <button className="thuprai-btn-pay" onClick={() => handlePayNow('buy')}>Pay now</button>
                  )}
                </div>

                <div className="thuprai-option-card">
                  <div className="thuprai-option-header">
                    <span className="thuprai-option-type">E-book (Rent)</span>
                    <span className="thuprai-option-price">Rs {book.rentPrice}</span>
                  </div>
                  <div className="thuprai-option-subtitle">{book.rentDays} days access</div>
                  {!showRentPayNow ? (
                    <>
                      <div className="thuprai-option-actions">
                        <div className="thuprai-quantity-selector">
                          <button onClick={() => setRentQuantity(Math.max(1, rentQuantity - 1))}>-</button>
                          <input type="number" value={rentQuantity} readOnly />
                          <button onClick={() => setRentQuantity(rentQuantity + 1)}>+</button>
                        </div>
                        <button className="thuprai-btn-add-cart-full" onClick={() => handleAddToCart('rent')}>
                          🛒 Add to cart
                        </button>
                      </div>
                    </>
                  ) : (
                    <button className="thuprai-btn-pay" onClick={() => handlePayNow('rent')}>Rent now</button>
                  )}
                </div>
              </div>

              {book.nominations && book.nominations.length > 0 && (
                <div className="thuprai-nominations">
                  <h3>Nominations</h3>
                  <ul>
                    {book.nominations.map((nomination, index) => (
                      <li key={index}>{nomination}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="thuprai-description">
                <p>{book.descriptionEn}</p>
                {book.descriptionNp && (
                  <>
                    <h4>नेपालीमा विवरण</h4>
                    <p>{book.descriptionNp}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Reviews and Ratings Section */}
          <ReviewSection bookId={id} />

          <div className="thuprai-related-section">
            <h3>Related Books</h3>
            <div className="thuprai-related-grid">
              {relatedBooks.map((relatedBook) => (
                <Link key={relatedBook.id} to={`/book/${generateSlug(relatedBook.title, relatedBook.id)}`} className="thuprai-related-card">
                  {getPlaceholderCover(relatedBook, 'medium')}
                  <div className="related-book-info">
                    <div className="related-book-title">{relatedBook.title}</div>
                    <div className="related-book-author">{relatedBook.author}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
