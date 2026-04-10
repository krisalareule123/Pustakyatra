import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ReviewSection from "../components/ReviewSection";
import "./Pages.css";

const API = "http://localhost:5001/api";

// Creates URL-friendly slug: "Muna Madan" + id 4 → "muna-madan-4"
export const bookSlug = (title, id) =>
  `${(title || "book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${id}`;

const COLORS = [
  "linear-gradient(135deg,#3b5723,#4a6b2a)",
  "linear-gradient(135deg,#2d4a1a,#3b5723)",
  "linear-gradient(135deg,#4a6b2a,#5a8234)",
  "linear-gradient(135deg,#1a2912,#2d4a1a)",
];

const initials = (title) =>
  title ? title.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") : "?";

export default function BookDetails() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  // Support slug format "muna-madan-4" — extract numeric ID from end
  const realId = bookId?.match(/(\d+)$/)?.[1] || bookId;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inCartBuy, setInCartBuy] = useState(false);
  const [inCartRent, setInCartRent] = useState(false);

  // Load book from real API
  useEffect(() => {
    if (!realId) return;
    fetch(`${API}/books/${realId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setBook(data.book);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [realId]);

  // Sync cart state
  useEffect(() => {
    const sync = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setInCartBuy(cart.some(i => String(i.bookId) === String(realId) && i.type === "buy"));
      setInCartRent(cart.some(i => String(i.bookId) === String(realId) && i.type === "rent"));
    };
    sync();
    window.addEventListener("cartUpdated", sync);
    return () => window.removeEventListener("cartUpdated", sync);
  }, [realId]);

  const addToCart = (type) => {
    const price = type === "buy" ? book.buy_price : book.rent_price;
    const item = {
      bookId: book.book_id,
      title: book.title,
      author: book.author_name,
      type,
      quantity: 1,
      price: parseFloat(price),
      totalPrice: parseFloat(price),
      rentDays: type === "rent" ? book.rent_days : null,
    };
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex(i => String(i.bookId) === String(book.book_id) && i.type === type);
    if (idx > -1) {
      cart[idx].quantity += 1;
      cart[idx].totalPrice = cart[idx].price * cart[idx].quantity;
    } else {
      cart.push(item);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
    window.dispatchEvent(new Event("openCart"));
  };

  const payNow = (type) => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }
    const price = type === "buy" ? book.buy_price : book.rent_price;
    const item = {
      bookId: book.book_id,
      title: book.title,
      author: book.author_name,
      type,
      quantity: 1,
      price: parseFloat(price),
      totalPrice: parseFloat(price),
      rentDays: type === "rent" ? book.rent_days : null,
    };
    navigate("/payment", { state: { items: [item], totalAmount: item.totalPrice } });
  };

  if (loading) return (
    <div className="thuprai-page">
      <div className="thuprai-container" style={{ padding: "80px 0", textAlign: "center", color: "#888" }}>
        Loading book...
      </div>
    </div>
  );

  if (notFound || !book) return (
    <div className="thuprai-page">
      <div className="thuprai-container">
        <div className="book-not-found">
          <h1>Book Not Found</h1>
          <p>This book does not exist or is not published yet.</p>
          <Link to="/browse" className="btn-primary-thuprai">Browse All Books</Link>
        </div>
      </div>
    </div>
  );

  const colorIdx = book.book_id % COLORS.length;

  return (
    <div className="thuprai-page">
      <div className="thuprai-container">
        <button className="back-btn" onClick={() => navigate(-1)}>Back to Browse</button>
        <div className="thuprai-breadcrumb">
          <Link to="/">Home</Link><span>/</span>
          <Link to="/browse">Books</Link><span>/</span>
          <span>{book.title}</span>
        </div>

        <div className="thuprai-book-layout">
          {/* Cover */}
          <div className="thuprai-book-cover">
            {book.cover_image ? (
              <img
                src={`http://localhost:5001/${book.cover_image}`}
                alt={book.title}
                style={{ width: "100%", height: "450px", objectFit: "cover",
                  borderRadius: "8px", display: "block" }}
              />
            ) : (
              <div className="book-placeholder-cover" style={{
                background: COLORS[colorIdx], width: "100%", height: "450px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "48px", fontWeight: "700",
                borderRadius: "8px", position: "relative", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", bottom: 10, left: 10, right: 10,
                  background: "rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px",
                  fontSize: 14, textAlign: "center" }}>
                  {book.nepali_title || book.title}
                </div>
                <span style={{ zIndex: 2 }}>{initials(book.title)}</span>
              </div>
            )}
            {book.category && (
              <div className="thuprai-tags">
                <span className="thuprai-tag">{book.category}</span>
                {book.language && <span className="thuprai-tag">{book.language}</span>}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="thuprai-book-info">
            <h1 className="thuprai-book-title">{book.title}</h1>
            {book.nepali_title && <h2 className="thuprai-book-subtitle">{book.nepali_title}</h2>}
            <div className="thuprai-author">
              by <strong>{book.author_name || "Unknown Author"}</strong>
            </div>

            {/* Purchase options — side by side */}
            <div className="pk-options-row">

              {/* Buy card */}
              <div className="pk-action-card">
                <div className="pk-action-label">E-book</div>
                <div className="pk-action-price">Rs {parseFloat(book.buy_price).toLocaleString()}</div>
                <div className="pk-action-note">Permanent access</div>
                <div className="pk-action-buttons">
                  {!inCartBuy ? (
                    <>
                      <button className="pk-btn-cart" onClick={() => addToCart("buy")}>
                        Add to cart
                      </button>
                      <button className="pk-btn-read" onClick={() => payNow("buy")}>
                        Read now
                      </button>
                    </>
                  ) : (
                    <button className="pk-btn-pay" onClick={() => payNow("buy")}>
                      Pay now
                    </button>
                  )}
                </div>
              </div>

              {/* Rent card */}
              <div className="pk-action-card">
                <div className="pk-action-label">E-book (Rent)</div>
                <div className="pk-action-price">Rs {parseFloat(book.rent_price).toLocaleString()}</div>
                <div className="pk-action-note">{book.rent_days} days access</div>
                <div className="pk-action-buttons">
                  {!inCartRent ? (
                    <>
                      <button className="pk-btn-cart" onClick={() => addToCart("rent")}>
                        Add to cart
                      </button>
                      <button className="pk-btn-read" onClick={() => payNow("rent")}>
                        Read now
                      </button>
                    </>
                  ) : (
                    <button className="pk-btn-pay" onClick={() => payNow("rent")}>
                      Pay now
                    </button>
                  )}
                </div>
              </div>

            </div>

            {book.description && (
              <div className="thuprai-description">
                <p>{book.description}</p>
              </div>
            )}
          </div>
        </div>

        <ReviewSection bookId={book.book_id} />
      </div>
    </div>
  );
}
