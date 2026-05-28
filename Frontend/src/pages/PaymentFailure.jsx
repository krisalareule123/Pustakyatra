import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./Payment.css";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get("reason") || "failed";

  const orderId = searchParams.get("orderId");
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch order details and mark the order as failed/cancelled in DB
  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    // Mark as failed in background
    orderAPI.failOrder(token, orderId, reason).catch(() => {});

    // Fetch order details
    orderAPI.getOrder(token, orderId)
      .then(res => {
        if (res.success && res.order) {
          setTotalAmount(parseFloat(res.order.totalAmount) || 0);
          setItems(res.order.items || []);
        }
      })
      .catch(err => console.error("Failed to fetch order details:", err))
      .finally(() => {
        setIsLoading(false);
      });
  }, [orderId, reason]);

  const handleRetry = () => {
    if (orderId && items.length > 0) {
      navigate("/payment", {
        state: { items, totalAmount, orderId: parseInt(orderId) }
      });
    } else {
      navigate("/browse");
    }
  };

  const isCancelled = reason === "cancelled";

  return (
    <div className="payment-page">
      <div className="payment-success">
        <div className="success-icon">{isCancelled ? "🚫" : "❌"}</div>
        <h2>{isCancelled ? "Payment Cancelled" : "Payment Failed"}</h2>
        <p>
          {isCancelled
            ? "You cancelled the payment. No charge was made to your account."
            : "Your payment could not be processed. Please try again or use a different method."}
        </p>

        {orderId && (
          <div className="success-details">
            <div className="success-detail-row">
              <span>Order ID</span>
              <strong>#{orderId}</strong>
            </div>
            {totalAmount > 0 && (
              <div className="success-detail-row">
                <span>Amount</span>
                <strong>Rs {totalAmount.toFixed(2)}</strong>
              </div>
            )}
            <div className="success-detail-row">
              <span>Status</span>
              <strong className="failure-status-text">
                {isCancelled ? "Payment Cancelled" : "Payment Failed"}
              </strong>
            </div>
          </div>
        )}

        {items.length > 0 && !isLoading && (
          <div className="success-items">
            <p className="success-items-label">Items in this order:</p>
            {items.map((item, i) => (
              <div key={i} className="success-item-row">
                <span className="success-item-title">{item.bookTitle || item.title}</span>
                <span className="success-item-access" style={{ color: "#6c757d" }}>
                  {(item.itemType || item.type) === "buy" ? "Buy" : `Rent · ${item.rentDays} days`}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="success-actions">
          {items.length > 0 && (
            <button className="btn-go-dashboard" onClick={handleRetry}>
              {isCancelled ? "Try Again" : "Retry Payment"}
            </button>
          )}
          <Link to="/my-orders" className="btn-go-dashboard btn-secondary-action">
            My Orders
          </Link>
          <Link to="/browse" className="btn-go-dashboard" style={{ background: "#6c757d" }}>
            Browse Books
          </Link>
        </div>
      </div>
    </div>
  );
}
