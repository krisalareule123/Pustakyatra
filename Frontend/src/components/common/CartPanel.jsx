import { useState, useEffect } from "react";
import { getBookById } from "../../data/mockBooks";
import "../../pages/Pages.css";

export default function CartPanel() {
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Load cart items
  useEffect(() => {
    loadCartItems();
  }, []);

  // Listen for cart icon click from navbar
  useEffect(() => {
    const handleCartIconClick = () => {
      loadCartItems(); // Reload cart items when opening
      setShowCartPanel(true);
    };
    
    const handleCartUpdate = () => {
      loadCartItems(); // Reload when cart is updated
    };
    
    window.addEventListener('openCart', handleCartIconClick);
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('openCart', handleCartIconClick);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartItems = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(existingCart);
  };

  const removeFromCart = (bookId, type) => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const updatedCart = existingCart.filter(
      item => !(item.bookId === bookId && item.type === type)
    );
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setCartItems(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateCartQuantity = (bookId, type, newQuantity) => {
    if (newQuantity < 1) return;
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemIndex = existingCart.findIndex(
      item => item.bookId === bookId && item.type === type
    );
    if (itemIndex > -1) {
      existingCart[itemIndex].quantity = newQuantity;
      existingCart[itemIndex].totalPrice = existingCart[itemIndex].price * newQuantity;
      localStorage.setItem('cart', JSON.stringify(existingCart));
      setCartItems(existingCart);
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleCloseCart = () => {
    setShowCartPanel(false);
    window.dispatchEvent(new Event('closeCart'));
  };

  const getPlaceholderCover = (book, size = 'small') => {
    if (!book) return null;
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
        <span style={{ zIndex: 2 }}>{initials}</span>
      </div>
    );
  };

  if (!showCartPanel) return null;

  return (
    <>
      <div className="cart-overlay" onClick={handleCloseCart}></div>
      <div className="cart-slide-panel">
        <div className="cart-panel-header">
          <h3>Your Cart</h3>
          <button className="cart-close-btn" onClick={handleCloseCart}>×</button>
        </div>
        
        <div className="cart-panel-content">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cartItems.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="cart-item-cover">
                      {getPlaceholderCover(getBookById(item.bookId), 'small')}
                    </div>
                    <div className="cart-item-details">
                      <div className="cart-item-title">{item.title}</div>
                      <div className="cart-item-type">{item.type === 'buy' ? 'E-book' : 'E-book (Rent)'}</div>
                      <div className="cart-item-price">Rs {item.price.toFixed(2)}</div>
                    </div>
                    <div className="cart-item-actions">
                      <div className="cart-item-quantity">
                        <button onClick={() => updateCartQuantity(item.bookId, item.type, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.bookId, item.type, item.quantity + 1)}>+</button>
                      </div>
                      <button className="cart-item-remove" onClick={() => removeFromCart(item.bookId, item.type)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-panel-footer">
                <div className="cart-total">
                  <span>TOTAL</span>
                  <span className="cart-total-amount">Rs {getCartTotal().toFixed(2)}</span>
                </div>
                <button className="cart-place-order-btn">PLACE ORDER</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
