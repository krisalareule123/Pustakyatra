import { useState, useEffect } from "react";

const API = "http://localhost:5001/api/authors";

const OCCASIONS = [
  { value: "new_launch",    label: "New Book Launch" },
  { value: "dashain",       label: "Dashain" },
  { value: "tihar",         label: "Tihar" },
  { value: "new_year",      label: "New Year" },
  { value: "teej",          label: "Teej" },
  { value: "first_reader",  label: "First Reader" },
  { value: "loyalty",       label: "Loyalty Reward" },
  { value: "review_reward", label: "Review Reward" },
  { value: "low_sales",     label: "Low Sales Boost" },
  { value: "custom",        label: "Custom" },
];

const STATUS_COLORS = {
  pending:  { bg: "#fef3c7", color: "#92400e" },
  active:   { bg: "#d1fae5", color: "#065f46" },
  disabled: { bg: "#fee2e2", color: "#991b1b" },
};

const defaultForm = {
  code: "", discount_type: "percentage", discount_value: "",
  promo_scope: "all_books", book_id: "", occasion: "new_launch",
  expiry_date: "", usage_limit: "100", per_reader_limit: "1", minimum_order_amount: "0"
};

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null); // null = create mode, number = edit mode
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("authorToken");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pcRes, bkRes] = await Promise.all([
        fetch(`${API}/promo-codes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API}/books`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      setPromoCodes(pcRes.promoCodes || []);
      setBooks(bkRes.books || []);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      const url = editingId
        ? `${API}/promo-codes/${editingId}`
        : `${API}/promo-codes`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          discount_value: parseFloat(form.discount_value),
          usage_limit: parseInt(form.usage_limit),
          per_reader_limit: parseInt(form.per_reader_limit),
          minimum_order_amount: parseFloat(form.minimum_order_amount),
          book_id: form.promo_scope === "specific_book" ? parseInt(form.book_id) : null,
        })
      }).then(r => r.json());

      if (res.success) {
        setSuccess(editingId ? "Promo code updated." : "Promo code created! Awaiting admin approval.");
        setForm(defaultForm);
        setShowForm(false);
        setEditingId(null);
        fetchData();
      } else {
        setError(res.message || "Failed.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pc) => {
    setEditingId(pc.promo_code_id);
    setForm({
      code: pc.code,
      discount_type: pc.discount_type,
      discount_value: String(pc.discount_value),
      promo_scope: pc.promo_scope,
      book_id: pc.book_id ? String(pc.book_id) : "",
      occasion: pc.occasion,
      expiry_date: pc.expiry_date ? pc.expiry_date.split("T")[0] : "",
      usage_limit: String(pc.usage_limit),
      per_reader_limit: String(pc.per_reader_limit),
      minimum_order_amount: String(pc.minimum_order_amount),
    });
    setShowForm(true);
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promo code?")) return;
    try {
      const res = await fetch(`${API}/promo-codes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json());
      if (res.success) { setSuccess("Promo code deleted."); fetchData(); }
      else setError(res.message);
    } catch {
      setError("Failed to delete.");
    }
  };

  // Minimum expiry date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Promo Codes</h2>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Create and manage discount codes for your books</p>
        </div>
        <button
          onClick={() => { setShowForm(f => !f); setError(""); setSuccess(""); setEditingId(null); setForm(defaultForm); }}
          style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
        >
          {showForm ? "Cancel" : "+ New Promo Code"}
        </button>
      </div>

      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: "10px 16px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{success}</div>}

      {/* Creation Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24, marginBottom: 28 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}>{editingId ? "Edit Promo Code" : "New Promo Code"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            <div>
              <label style={labelStyle}>Code *</label>
              <input name="code" value={form.code} onChange={handleChange} required placeholder="e.g. DASHAIN25"
                disabled={!!editingId}
                style={{ ...inputStyle, textTransform: "uppercase", background: editingId ? "#f3f4f6" : "#fff", color: editingId ? "#9ca3af" : "#1f2937" }} />
              {editingId && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>Code cannot be changed after creation</p>}
            </div>

            <div>
              <label style={labelStyle}>Occasion *</label>
              <select name="occasion" value={form.occasion} onChange={handleChange} style={inputStyle}>
                {OCCASIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Discount Type *</label>
              <select name="discount_type" value={form.discount_type} onChange={handleChange} style={inputStyle}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (Rs)</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Discount Value *</label>
              <input name="discount_value" type="number" value={form.discount_value} onChange={handleChange} required
                min={1} max={form.discount_type === "percentage" ? 100 : undefined}
                placeholder={form.discount_type === "percentage" ? "e.g. 20" : "e.g. 50"}
                style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Scope *</label>
              <select name="promo_scope" value={form.promo_scope} onChange={handleChange} style={inputStyle}>
                <option value="all_books">All My Books</option>
                <option value="specific_book">Specific Book</option>
                <option value="rent_only">Rent Only</option>
              </select>
            </div>

            {form.promo_scope === "specific_book" && (
              <div>
                <label style={labelStyle}>Select Book *</label>
                <select name="book_id" value={form.book_id} onChange={handleChange} required style={inputStyle}>
                  <option value="">— Select a book —</option>
                  {books.map(b => <option key={b.book_id} value={b.book_id}>{b.title}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={labelStyle}>Expiry Date *</label>
              <input name="expiry_date" type="date" value={form.expiry_date} onChange={handleChange} required min={minDateStr} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Usage Limit</label>
              <input name="usage_limit" type="number" value={form.usage_limit} onChange={handleChange} min={1} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Per Reader Limit</label>
              <input name="per_reader_limit" type="number" value={form.per_reader_limit} onChange={handleChange} min={1} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Minimum Order Amount (Rs)</label>
              <input name="minimum_order_amount" type="number" value={form.minimum_order_amount} onChange={handleChange} min={0} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
            <button type="submit" disabled={submitting}
              style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, cursor: "pointer" }}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Promo Code"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(defaultForm); }}
              style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Promo Codes Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading...</div>
      ) : promoCodes.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "#f9fafb", borderRadius: 12, color: "#6b7280" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <p style={{ margin: 0, fontWeight: 500 }}>No promo codes yet</p>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>Create your first promo code to attract readers</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Code", "Occasion", "Discount", "Scope", "Expiry", "Usage", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((pc, i) => {
                const sc = STATUS_COLORS[pc.status] || {};
                return (
                  <tr key={pc.promo_code_id} style={{ borderBottom: i < promoCodes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontFamily: "monospace", color: "#1f2937" }}>{pc.code}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", textTransform: "capitalize" }}>{pc.occasion.replace(/_/g, " ")}</td>
                    <td style={{ padding: "12px 16px", color: "#1f2937" }}>
                      {pc.discount_type === "percentage" ? `${pc.discount_value}%` : `Rs ${pc.discount_value}`}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
                      {pc.promo_scope === "specific_book" ? (pc.book_title || "Specific Book") : pc.promo_scope.replace(/_/g, " ")}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
                      {new Date(pc.expiry_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 13 }}>
                      {pc.usage_count} / {pc.usage_limit}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                        {pc.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {pc.status === "pending" && (
                          <button onClick={() => handleEdit(pc)}
                            style={{ background: "#e0e7ff", color: "#3730a3", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Edit
                          </button>
                        )}
                        {pc.status === "pending" && (
                          <button onClick={() => handleDelete(pc.promo_code_id)}
                            style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                            Delete
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

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: 14, color: "#1f2937", background: "#fff", boxSizing: "border-box", outline: "none"
};
