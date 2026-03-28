import { useSearchParams, Link, useNavigate } from "react-router-dom";
import "./Payment.css";

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get("reason") || "cancelled";

  // These are passed back from eSewa's failure redirect
  // We store them so the user can retry with the same order
  const orderId = searchParams.get("orderId");
  const totalAmount = parseFloat(searchParams.get("totalAmount") || "0");
  const itemsRaw = searchParams.get("items");
  let items = [];
  try {
    items = itemsRaw ? JSON.parse(decodeURIComponent(itemsRaw)) : [];
  } catch {
    items = [];
  }

  const handleRetry = () => {
    if (orderId && items.length > 0) {
      // Navigate back to payment page with existing orderId — no new order created
      navigate("/payment", {
        state: { items, totalAmount, orderId: parseInt(orderId) }
      });
    } else {
      navigate("/browse");
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-success">
        <div className="success-icon">{reason === "cancelled" ? "🚫" : "❌"}</div>
        <h2>{reason === "cancelled" ? "Payment Cancelled" : "Payment Failed"}</h2>
        <p>
          {reason === "cancelled"
            ? "You cancelled the payment. No charge was made."
            : "Your payment could not be processed. Please try again."}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          {items.length > 0 && (
            <button className="btn-go-dashboard" onClick={handleRetry}>
              Try Again
            </button>
          )}
          <Link to="/browse" className="btn-go-dashboard" style={{ background: "#6c757d" }}>
            Back to Browse
          </Link>
        </div>
      </div>
    </div>
  );
}
