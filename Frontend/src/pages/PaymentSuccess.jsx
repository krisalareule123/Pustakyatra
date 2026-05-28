import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./Payment.css";

const STATUS_LABELS = {
  pending_payment: "Waiting for Payment",
  payment_submitted: "Payment Submitted",
  paid: "Payment Successful",
  failed: "Payment Failed",
  cancelled: "Payment Cancelled",
};

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");
  const verifyCalledRef = useRef(false); // prevent double-call in React StrictMode

  useEffect(() => {
    // Guard: only run once even if effect fires twice (React StrictMode)
    if (verifyCalledRef.current) return;
    verifyCalledRef.current = true;

    const verify = async () => {
      const encodedData = searchParams.get("data");
      if (!encodedData) {
        setStatus("failed");
        setError("No payment data received from eSewa.");
        return;
      }
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        setStatus("failed");
        setError("You are not logged in.");
        return;
      }
      try {
        console.log("Sending encodedData to verify API, length:", encodedData.length);
        const response = await orderAPI.verifyEsewa(token, encodedData);
        console.log("verifyEsewa API response:", response);
        if (response.success) {
          setOrderData(response);
          setStatus("success");
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("cartUpdated"));
        } else {
          setStatus("failed");
          setError(response.message || "Payment verification failed.");
        }
      } catch (err) {
        setStatus("failed");
        setError(err.message || "Payment verification failed.");
      }
    };
    verify();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-NP", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (status === "verifying") {
    return (
      <div className="payment-loading">
        <div className="payment-spinner"></div>
        <p>Verifying your payment with eSewa...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="payment-page">
        <div className="payment-success">
          <div className="success-icon">✅</div>
          <h2>Payment Successful</h2>
          {searchParams.get("demo") === "true" ? (
            <p style={{ color: "#059669", fontWeight: "bold", background: "#d1fae5", padding: "8px", borderRadius: "4px" }}>
              Demo Payment Successful (For Viva Demonstration)
            </p>
          ) : (
            <p>Your payment has been verified. Your e-books are now available.</p>
          )}

          <div className="success-details">
            {orderData?.orderId && (
              <div className="success-detail-row">
                <span>Order ID</span>
                <strong>#{orderData.orderId}</strong>
              </div>
            )}
            {orderData?.totalAmount && (
              <div className="success-detail-row">
                <span>Amount Paid</span>
                <strong>Rs {parseFloat(orderData.totalAmount).toFixed(2)}</strong>
              </div>
            )}
            {orderData?.transactionCode && (
              <div className="success-detail-row">
                <span>eSewa Ref</span>
                <strong>{orderData.transactionCode}</strong>
              </div>
            )}
            {orderData?.paymentReference && (
              <div className="success-detail-row">
                <span>Payment Ref</span>
                <strong style={{ fontSize: 12, wordBreak: "break-all" }}>{orderData.paymentReference}</strong>
              </div>
            )}
            {orderData?.paidAt && (
              <div className="success-detail-row">
                <span>Payment Time</span>
                <strong>{formatDate(orderData.paidAt)}</strong>
              </div>
            )}
            <div className="success-detail-row">
              <span>Status</span>
              <strong className="success-status-text">Payment Successful</strong>
            </div>
          </div>

          {/* Purchased items */}
          {orderData?.items?.length > 0 && (
            <div className="success-items">
              <p className="success-items-label">Books in this order:</p>
              {orderData.items.map((item, i) => (
                <div key={i} className="success-item-row">
                  <span className="success-item-title">{item.bookTitle}</span>
                  <span className="success-item-access">
                    {item.itemType === "buy"
                      ? "✅ Permanent access"
                      : item.accessExpiresAt
                        ? `⏳ Access until ${formatDate(item.accessExpiresAt)}`
                        : `⏳ Rent · ${item.rentDays} days`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="success-actions">
            <Link to="/my-library" className="btn-go-dashboard">Go to My Library</Link>
            <Link to="/my-orders" className="btn-go-dashboard btn-secondary-action">View Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-success">
        <div className="success-icon">❌</div>
        <h2>Verification Failed</h2>
        <p>{error || "Something went wrong while verifying your payment."}</p>
        <p className="success-support-note">
          If your payment was deducted, please contact support with your eSewa transaction ID.
        </p>
        <div className="success-actions">
          <Link to="/my-orders" className="btn-go-dashboard">Check My Orders</Link>
          <Link to="/browse" className="btn-go-dashboard btn-secondary-action">Browse Books</Link>
        </div>
      </div>
    </div>
  );
}
