import { useState, useEffect } from "react";

const API = "http://localhost:5001/api/admin";

const STATUS_COLORS = {
  pending:  { bg: "#fef3c7", color: "#92400e" },
  active:   { bg: "#d1fae5", color: "#065f46" },
  disabled: { bg: "#fee2e2", color: "#991b1b" },
};

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");

  const token = localStorage.getItem("adminToken");

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/promo-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      setPromoCodes(res.promoCodes || []);
    } catch {
      setError("Failed to load promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromoCodes(); }, []);

  const updateStatus = async (id, status) => {
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API}/promo-codes/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      }).then(r => r.json());

      if (res.success) {
        setSuccess(res.message);
        fetchPromoCodes();
        window.dispatchEvent(new Event("adminBadgeRefresh"));
      } else {
        setError(res.message || "Failed to update status.");
      }
    } catch {
      setError("Server error.");
    }
  };

  const filtered = filter === "all" ? promoCodes : promoCodes.filter(p => p.status === filter);

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Promo Codes</h2>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Review and approve promo codes submitted by authors</p>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{success}</div>}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "pending", "active", "disabled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px", borderRadius: 20, border: "1px solid #e5e7eb",
              background: filter === f ? "#4f46e5" : "#fff",
              color: filter === f ? "#fff" : "#374151",
              fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize"
            }}>
            {f === "all" ? `All (${promoCodes.length})` : `${f} (${promoCodes.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "#f9fafb", borderRadius: 12, color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <p style={{ margin: 0, fontWeight: 500 }}>No promo codes found</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Code", "Author", "Book", "Occasion", "Discount", "Expiry", "Usage", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((pc, i) => {
                const sc = STATUS_COLORS[pc.status] || {};
                const isExpired = new Date(pc.expiry_date) < new Date();
                return (
                  <tr key={pc.promo_code_id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 700, fontFamily: "monospace", color: "#1f2937" }}>{pc.code}</td>
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{pc.author_name}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 13 }}>{pc.book_title || "—"}</td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 13, textTransform: "capitalize" }}>{pc.occasion.replace(/_/g, " ")}</td>
                    <td style={{ padding: "12px 14px", color: "#1f2937" }}>
                      {pc.discount_type === "percentage" ? `${pc.discount_value}%` : `Rs ${pc.discount_value}`}
                    </td>
                    <td style={{ padding: "12px 14px", color: isExpired ? "#ef4444" : "#6b7280", fontSize: 13 }}>
                      {new Date(pc.expiry_date).toLocaleDateString()}
                      {isExpired && <span style={{ marginLeft: 4, fontSize: 11 }}>(expired)</span>}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 13 }}>
                      {pc.usage_count} / {pc.usage_limit}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                        {pc.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {pc.status === "pending" && (
                          <button onClick={() => updateStatus(pc.promo_code_id, "active")}
                            style={{ background: "#d1fae5", color: "#065f46", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Approve
                          </button>
                        )}
                        {pc.status === "active" && (
                          <button onClick={() => updateStatus(pc.promo_code_id, "disabled")}
                            style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Disable
                          </button>
                        )}
                        {pc.status === "disabled" && (
                          <button onClick={() => updateStatus(pc.promo_code_id, "active")}
                            style={{ background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Re-enable
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
