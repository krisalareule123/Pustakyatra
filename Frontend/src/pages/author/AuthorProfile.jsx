import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

export default function AuthorProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authorToken");

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "" });
  const [stats, setStats] = useState({ totalBooks: 0, published: 0, totalEarnings: 0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const h = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/authors/me`, { headers: h }).then(r => r.json()),
      fetch(`${API}/authors/stats`, { headers: h }).then(r => r.json()),
    ]).then(([profileRes, statsRes]) => {
      if (profileRes.success) {
        setProfile(profileRes.author);
        setForm({
          fullName: profileRes.author.fullName || "",
          phone: profileRes.author.phone || "",
          bio: profileRes.author.bio || "",
        });
      }
      if (statsRes.success) setStats(statsRes.stats);
    }).catch(console.error);
  }, [token, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${API}/authors/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: "success", text: "Profile updated successfully." });
        // Update localStorage
        const stored = JSON.parse(localStorage.getItem("authorData") || "{}");
        localStorage.setItem("authorData", JSON.stringify({ ...stored, fullName: form.fullName }));
      } else {
        setMsg({ type: "error", text: data.message || "Failed to update profile." });
      }
    } catch {
      setMsg({ type: "error", text: "Could not connect to server." });
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return (
    <div className="dashboard-workspace">
      <p style={{ color: "#888", padding: 32 }}>Loading profile...</p>
    </div>
  );

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Profile & Settings</h1>
          <div className="dashboard-date">Manage your author account</div>
        </div>
      </div>

      {/* Identity card */}
      <div className="profile-identity-card">
        <div className="profile-identity-avatar">{profile.fullName?.charAt(0).toUpperCase()}</div>
        <div className="profile-identity-info">
          <div className="profile-identity-name">{profile.fullName}</div>
          <div className="profile-identity-email">{profile.email}</div>
          <div className="profile-identity-id">Author ID: #{profile.author_id}</div>
        </div>
        <div className="profile-identity-stats">
          <div className="pid-stat"><span>{stats.totalBooks}</span>Books</div>
          <div className="pid-stat"><span>{stats.published}</span>Published</div>
          <div className="pid-stat"><span>Rs. {(stats.totalEarnings || 0).toLocaleString()}</span>Earnings</div>
        </div>
      </div>

      {/* Edit form */}
      <div className="profile-settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Edit Profile</h2>
        </div>

        {msg.text && (
          <div style={{
            padding: "12px 16px", borderRadius: 8, marginBottom: 16,
            background: msg.type === "success" ? "#d4edda" : "#f8d7da",
            color: msg.type === "success" ? "#155724" : "#721c24"
          }}>{msg.text}</div>
        )}

        <form onSubmit={handleSave} className="settings-form">
          <div className="settings-form-grid">
            <div className="settings-form-group">
              <label className="settings-label">Full Name</label>
              <input
                className="settings-input"
                value={form.fullName}
                onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="settings-form-group">
              <label className="settings-label">Phone</label>
              <input
                className="settings-input"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+977-98XXXXXXXX"
              />
            </div>
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Email Address</label>
            <input className="settings-input readonly" value={profile.email} readOnly />
            <p className="settings-hint">Email cannot be changed.</p>
          </div>

          <div className="settings-form-group">
            <label className="settings-label">Author Bio</label>
            <textarea
              className="settings-textarea"
              rows={5}
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Tell readers about yourself..."
            />
          </div>

          <div className="settings-form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
