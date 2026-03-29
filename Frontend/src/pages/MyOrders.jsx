import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { orderAPI } from "../services/api";
import "./MyOrders.css";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const initials = (title) =>
  title ? title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "?";

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }

    orderAPI.getMyOrders(token, "paid")
      .then((res) => { if (res.success) setOrders(res.orders); })
      .catch((err) => setError(err.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="mo-page">
        <div className="mo-center">
          <div className="mo-spinner" />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mo-page">
      <div className="mo-wrap">

        <div className="mo-header">
          <div>
            <h1 className="mo-title">My Orders</h1>
            <p className="mo-sub">Completed purchases</p>
          </div>
          <Link to="/browse" className="mo-btn-browse">Browse Books</Link>
        </div>

        {error && <div className="mo-error">{error}</div>}

        {orders.length === 0 ? (
          <div className="mo-empty">
            <span className="mo-empty-icon">📚</span>
            <p className="mo-empty-msg">No purchases yet</p>
            <p className="mo-empty-sub">Your completed orders will appear here.</p>
            <Link to="/browse" className="mo-btn-browse">Start browsing</Link>
          </div>
        ) : (
          <div className="mo-list">
            {orders.map((order) => (
              <div key={order.orderId} className="mo-card">

                {/* Top bar */}
                <div className="mo-card-head">
                  <div className="mo-card-meta">
                    <span className="mo-oid">Order #{order.orderId}</span>
                    <span className="mo-odate">{fmtDate(order.createdAt)}</span>
                  </div>
                  <div className="mo-card-meta-right">
                    <span className="mo-badge-paid">Paid</span>
                    <span className="mo-total">Rs {parseFloat(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Book list */}
                {order.items && order.items.length > 0 && (
                  <div className="mo-items">
                    {order.items.map((item, i) => {
                      const isRent = item.itemType === "rent";
                      const expired = isRent && item.accessExpiresAt && new Date(item.accessExpiresAt) < new Date();
                      return (
                        <div key={i} className="mo-item">
                          <div className="mo-avatar">{initials(item.bookTitle)}</div>
                          <div className="mo-item-info">
                            <span className="mo-book-name">{item.bookTitle}</span>
                            <span className="mo-access-tag">
                              {isRent ? (
                                expired
                                  ? "Rental expired"
                                  : item.accessExpiresAt
                                    ? "Rental · expires " + fmtDate(item.accessExpiresAt)
                                    : "Rental · " + item.rentDays + " days"
                              ) : (
                                "Purchased · Permanent access"
                              )}
                            </span>
                          </div>
                          <span className="mo-item-price">
                            Rs {parseFloat(item.totalPrice).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                <div className="mo-card-foot">
                  <span className="mo-paid-on">
                    ✓ Paid {fmtDateTime(order.paidAt)}
                  </span>
                  {order.transactionCode && (
                    <span className="mo-ref">Ref: {order.transactionCode}</span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
