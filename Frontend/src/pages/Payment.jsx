import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./Payment.css";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = location.state?.items || [];
  const totalAmount = location.state?.totalAmount || 0;
  // If we already created an order (e.g. came back from failure), reuse it
  const existingOrderId = location.state?.orderId || null;

  const [orderId, setOrderId] = useState(existingOrderId);
  const [loading, setLoading] = useState(!existingOrderId);
  const [esewaLoading, setEsewaLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState(null); // { discount_amount, discounted_total, promo_code_id, code }
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

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
        const response = await orderAPI.createOrder(token, {
          items, totalAmount,
          promoCodeId: promoResult?.promo_code_id || null,
          discountAmount: promoResult?.discount_amount || 0,
          discountedTotal: promoResult?.discounted_total || null,
        });
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

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError(""); setPromoResult(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const res = await fetch("http://localhost:5001/api/readers/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: promoCode.trim(), items, cartTotal: totalAmount })
      }).then(r => r.json());

      if (res.success) {
        setPromoResult(res);
      } else {
        setPromoError(res.message || "Invalid promo code.");
      }
    } catch {
      setPromoError("Failed to validate promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoResult(null); setPromoCode(""); setPromoError("");
  };

  // Redirect to Stripe Checkout
  const handleStripePayment = async () => {
    if (!orderId || redirecting) return;

    setRedirecting(true);
    setStripeLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await orderAPI.createStripeSession(token, orderId);

      if (!response.success || !response.url) {
        setError("Failed to initiate Stripe payment. Please try again.");
        setRedirecting(false);
        setStripeLoading(false);
        return;
      }

      // Redirect to Stripe Checkout — page navigates away
      window.location.href = response.url;
    } catch (err) {
      setError(err.message || "Failed to initiate Stripe payment.");
      setRedirecting(false);
      setStripeLoading(false);
    }
  };

  // Redirect to eSewa — disable button immediately to prevent double clicks
  const handleEsewaPayment = async () => {
    if (!orderId || redirecting) return;

    setRedirecting(true); // locks the button permanently until page leaves
    setEsewaLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await orderAPI.initiateEsewa(token, orderId, promoResult ? promoResult.discounted_total : totalAmount, items);

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

  // Simulate payment — bypasses eSewa when sandbox is down (502/503)
  const handleSimulatePayment = async () => {
    if (!orderId || redirecting) return;
    setRedirecting(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const response = await orderAPI.simulatePayment(token, orderId);
      if (response.success) {
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
        // Navigate to my-orders directly — no eSewa redirect needed
        navigate("/my-orders");
      } else {
        setError(response.message || "Simulation failed.");
        setRedirecting(false);
      }
    } catch (err) {
      setError(err.message || "Simulation failed.");
      setRedirecting(false);
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
      <button className="back-btn" onClick={() => navigate(-1)}
        style={{ marginLeft: 24, marginTop: 8 }}>
        Back
      </button>
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

          {/* Promo Code Input */}
          <div style={{ margin: "16px 0", padding: "16px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: 14, color: "#374151" }}>🏷️ Have a promo code?</p>
            {promoResult ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#d1fae5", padding: "10px 14px", borderRadius: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, color: "#065f46", fontFamily: "monospace" }}>{promoResult.code}</span>
                  <span style={{ marginLeft: 10, color: "#065f46", fontSize: 13 }}>
                    — Rs {promoResult.discount_amount.toFixed(2)} off applied!
                  </span>
                </div>
                <button onClick={handleRemovePromo} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Remove</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={promoCode}
                  onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                  placeholder="Enter promo code"
                  style={{ flex: 1, padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "monospace", textTransform: "uppercase" }}
                  onKeyDown={e => e.key === "Enter" && handleApplyPromo()}
                />
                <button onClick={handleApplyPromo} disabled={promoLoading || !promoCode.trim()}
                  style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {promoLoading ? "..." : "Apply"}
                </button>
              </div>
            )}
            {promoError && <p style={{ margin: "8px 0 0", color: "#dc2626", fontSize: 13 }}>{promoError}</p>}
          </div>

          <div className="payment-total-row">
            <span>Total</span>
            <span className="payment-total-amount">
              {promoResult ? (
                <>
                  <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: 16, marginRight: 8 }}>Rs {totalAmount.toFixed(2)}</span>
                  Rs {promoResult.discounted_total.toFixed(2)}
                </>
              ) : (
                `Rs ${totalAmount.toFixed(2)}`
              )}
            </span>
          </div>

          <div className="payment-method-section">
            <h3>Pay via</h3>

            <div className="esewa-payment-box">
              <div className="esewa-info-side" style={{ width: "100%" }}>
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
                  {redirecting && esewaLoading ? "Redirecting to eSewa..." : "Pay with eSewa →"}
                </button>

                {/* Shown when eSewa sandbox is down — remove in production */}
                <button
                  className="btn-simulate-pay"
                  onClick={handleSimulatePayment}
                  disabled={redirecting || !orderId}
                  title="Use this when eSewa sandbox is unavailable (502/503)"
                >
                  🧪 Simulate Payment (eSewa down)
                </button>
              </div>
            </div>

            {/* Stripe / Card Payment */}
            <div className="esewa-payment-box" style={{ marginTop: 16 }}>
              <div className="esewa-info-side" style={{ width: "100%" }}>
                <div className="esewa-logo-box" style={{ borderColor: "#635bff" }}>
                  <span className="esewa-logo-text" style={{ color: "#635bff" }}>💳 Card</span>
                </div>
                <p className="esewa-desc">
                  Pay securely with your credit or debit card via Stripe.
                  You will be redirected to the Stripe checkout page.
                </p>
                <button
                  className="btn-esewa-pay"
                  onClick={handleStripePayment}
                  disabled={stripeLoading || redirecting || !orderId}
                  style={{ background: stripeLoading || redirecting || !orderId ? "#a5a0f5" : "#635bff" }}
                >
                  {stripeLoading ? "Redirecting to Stripe..." : "Pay with Card →"}
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
              <span>
                {promoResult ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: 13, marginRight: 6 }}>Rs {totalAmount.toFixed(2)}</span>
                    Rs {promoResult.discounted_total.toFixed(2)}
                  </>
                ) : (
                  `Rs ${totalAmount.toFixed(2)}`
                )}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
