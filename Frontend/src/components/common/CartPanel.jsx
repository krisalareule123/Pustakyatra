import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../pages/Pages.css";

const COLORS = [
  "linear-gradient(135deg,#3b5723,#4a6b2a)",
  "linear-gradient(135deg,#2d4a1a,#3b5723)",
  "linear-gradient(135deg,#4a6b2a,#5a8234)",
  "linear-gradient(135deg,#1a2912,#2d4a1a)",
];

const inits = (title) =>
  title ? title.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("") : "?";

export default function CartPanel() {
  const navigate = useNavigate();
  const [show, setShow]           = useState(false);
  const [cartItems, setCartItems] = useState([]);

  const load = () => setCartItems(JSON.parse(localStorage.getItem("cart") || "[]"));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const open   = () => { load(); setShow(true); };
    const update = () => load();
    window.addEventListener("openCart",    open);
    window.addEventListener("cartUpdated", update);
    return () => {
      window.removeEventListener("openCart",    open);
      window.removeEventListener("cartUpdated", update);
    };
  }, []);

  const remove = (bookId, type) => {
    const updated = cartItems.filter(i => !(i.bookId === bookId && i.type === type));
    localStorage.setItem("cart", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const setQty = (bookId, type, val) => {
    const qty = Math.max(1, parseInt(val) || 1);
    const updated = cartItems.map(i =>
      i.bookId === bookId && i.type === type
        ? { ...i, quantity: qty, totalPrice: i.price * qty }
        : i
    );
    localStorage.setItem("cart", JSON.stringify(updated));
    setCartItems(updated);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const total = cartItems.reduce((s, i) => s + i.totalPrice, 0);

  const placeOrder = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }
    setShow(false);
    navigate("/payment", { state: { items: cartItems, totalAmount: total } });
  };

  const close = () => { setShow(false); window.dispatchEvent(new Event("closeCart")); };

  if (!show) return null;

  return (
    <>
      <div className="cart-overlay" onClick={close} />

      <div className="cart-slide-panel">
        {/* Header */}
        <div className="cart-panel-header">
          <h3>Your Cart <span style={{ fontSize: 13, fontWeight: 500, color: "#888" }}>({cartItems.length})</span></h3>
          <button className="cart-close-btn" onClick={close}>×</button>
        </div>

        <div className="cart-panel-content">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <p style={{ color: "#888", fontSize: 14 }}>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="cart-item">

                    {/* Cover */}
                    <div className="cart-item-cover">
                      {item.coverImage ? (
                        <img src={`http://localhost:5001/${item.coverImage}`} alt={item.title}
                          style={{ width: 52, height: 72, objectFit: "cover", borderRadius: 6 }} />
                      ) : (
                        <div style={{
                          width: 52, height: 72, borderRadius: 6, flexShrink: 0,
                          background: COLORS[idx % COLORS.length],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "white", fontSize: 14, fontWeight: 700
                        }}>{inits(item.title)}</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="cart-item-details">
                      <div className="cart-item-title">{item.title}</div>
                      <div className="cart-item-type">
                        {item.type === "buy" ? "E-book" : `E-book (Rent · ${item.rentDays || "—"} days)`}
                      </div>

                      {/* Qty + Remove row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => setQty(item.bookId, item.type, e.target.value)}
                          className="cart-qty-input"
                        />
                        <button className="cart-item-remove" onClick={() => remove(item.bookId, item.type)}>
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="cart-item-price" style={{ flexShrink: 0, textAlign: "right" }}>
                      Rs {item.totalPrice.toFixed(2)}
                    </div>

                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="cart-panel-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span className="cart-total-amount">Rs {total.toFixed(2)}</span>
                </div>
                <button className="cart-place-order-btn" onClick={placeOrder}>
                  Place Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
