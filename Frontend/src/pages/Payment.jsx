import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import esewaQR from "../assets/Esewa_QR.png";
import "./Payment.css";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = location.state?.items || [];
  const totalAmount = location.state?.totalAmount || 0;
  // If we already created an order (e.g. came back from failure), reuse it
  const existingOrderId = location.state?.orderId || null;

  const [orderId, setOrderId] = useState(existingOrderId);
  const [loading, setLoading] = useState(!existingOrderId); // skip loading if order already exists
  const [esewaLoading, setEsewaLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  // Guard against double-creation in React StrictMode / double mount
  const orderCreated = useRef(false);

  useEffect(() => {
    // If we already have an orderId (passed back from failure page), skip creation
    if (existingOrderId) return;

    if (items.length === 0) {
      navigate("/browse");
      return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    // Prevent double creation
    if (orderCreated.current) return;
    orderCreated.current = true;

    const createOrder = async () => {
      try {
        const response = await orderAPI.createOrder(token, { items, totalAmount });
        if (response.success) {
          setOrderId(response.order.orderId);
        }
      } catch (err) {
        setError(err.message || "Failed to create order. Please try again.");
        orderCreated.current = false; // allow retry on error
      } finally {
        setLoading(false);
      }
    };

    createOrder();
  }, []);

  // Redirect to eSewa — disable button immediately to prevent double clicks
  const handleEsewaPayment = async () => {
    if (!orderId || redirecting) return;

    setRedirecting(true); // locks the button permanently until page leaves
    setEsewaLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await orderAPI.initiateEsewa(token, orderId, totalAmount, items);

      if (!response.success) {
        setError("Failed to initiate payment. Please try again.");
        setRedirecting(false);
        setEsewaLoading(false);
        return;
      }

      const { paymentData, paymentUrl } = response;

      // Debug: log full payload before submitting to eSewa
      console.log("=== eSewa Form Submit Debug ===");
      console.log("Payment URL:", paymentUrl);
      console.log("Payload:", paymentData);
      console.log("All fields present:", Object.entries(paymentData).map(([k,v]) => `${k}=${v}`).join(" | "));
      console.log("===============================");

      // Build and submit a hidden form — page will navigate away
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;

      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      // Page navigates away — no need to reset state
    } catch (err) {
      setError(err.message || "Failed to initiate eSewa payment.");
      setRedirecting(false);
      setEsewaLoading(false);
    }
  };

  // Cancel: mark order as cancelled in DB, then go back
  const handleCancelOrder = async () => {
    if (orderId) {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        await orderAPI.failOrder(token, orderId, "cancelled");
      } catch {
        // non-blocking — still navigate away
      }
    }
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="payment-loading">
        <div className="payment-spinner"></div>
        <p>Creating your order...</p>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">

        {/* LEFT: Payment Method */}
        <div className="payment-left">
          <div className="payment-order-meta">
            <h2 className="payment-order-id">Order #{orderId || "..."}</h2>
            <span className="payment-status-badge pending_payment">Pending Payment</span>
          </div>

          <div className="payment-notice">
            📚 You will receive access to your e-books after payment is confirmed.
          </div>

          <div className="payment-total-row">
            <span>Total</span>
            <span className="payment-total-amount">Rs {totalAmount.toFixed(2)}</span>
          </div>

          <div className="payment-method-section">
            <h3>Pay via</h3>

            <div className="esewa-payment-box">
              <div className="esewa-qr-side">
                <p className="qr-label">Or scan QR to pay</p>
                <img src={esewaQR} alt="eSewa QR Code" className="esewa-qr-img" />
              </div>

              <div className="esewa-info-side">
                <div className="esewa-logo-box">
                  <span className="esewa-logo-text">eSewa</span>
                </div>
                <p className="esewa-desc">
                  Click the button below to pay securely through eSewa.
                  You will be redirected to the eSewa payment page.
                </p>
                <button
                  className="btn-esewa-pay"
                  onClick={handleEsewaPayment}
                  disabled={esewaLoading || redirecting || !orderId}
                >
                  {redirecting ? "Redirecting to eSewa..." : "Pay with eSewa →"}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="payment-error">
              {error}
              <button
                className="payment-retry-btn"
                onClick={() => { setError(""); setRedirecting(false); setEsewaLoading(false); }}
              >
                Try Again
              </button>
            </div>
          )}

          <div className="payment-actions">
            <button
              className="btn-cancel-order"
              onClick={handleCancelOrder}
              disabled={redirecting}
            >
              Cancel Order
            </button>
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="payment-right">
          <div className="order-summary-card">
            <h3 className="summary-title">Order Summary</h3>

            <div className="summary-items">
              {items.map((item, i) => (
                <div key={i} className="summary-item">
                  <div className="summary-item-cover">
                    <div className="summary-cover-placeholder">
                      {item.title?.split(" ").slice(0, 2).map(w => w[0]).join("")}
                    </div>
                  </div>
                  <div className="summary-item-info">
                    <p className="summary-item-title">{item.title}</p>
                    <p className="summary-item-type">
                      {item.type === "buy" ? "E-book" : `E-book (Rent · ${item.rentDays} days)`}
                    </p>
                    <p className="summary-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <div className="summary-item-price">
                    Rs {item.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Delivery</span>
              <span className="summary-free">Digital — No shipping</span>
            </div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <span>Rs {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
