import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./Payment.css";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      // eSewa sends response as Base64 in ?data= query param
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
        const response = await orderAPI.verifyEsewa(token, encodedData);
        if (response.success) {
          setOrderId(response.orderId);
          setStatus("success");

          // Clear cart after successful payment
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

  if (status === "verifying") {
    return (
      <div className="payment-loading">
        <div className="payment-spinner"></div>
        <p>Verifying your payment...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="payment-page">
        <div className="payment-success">
          <div className="success-icon">✅</div>
          <h2>Payment Successful!</h2>
          <p>Your payment has been verified. Your e-books are now available in your dashboard.</p>
          {orderId && <p className="order-ref">Order #{orderId}</p>}
          <Link to="/dashboard" className="btn-go-dashboard">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-success">
        <div className="success-icon">❌</div>
        <h2>Payment Verification Failed</h2>
        <p>{error || "Something went wrong while verifying your payment."}</p>
        <Link to="/browse" className="btn-go-dashboard" style={{ background: "#dc3545" }}>
          Back to Browse
        </Link>
      </div>
    </div>
  );
}
