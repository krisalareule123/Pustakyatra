import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

// Format author_id as a professional readable ID
const formatAuthorId = (id) => {
  if (!id) return "—";
  const padded = String(id).padStart(4, "0");
  const hash = (id * 9973 + 12345) % 100000;
  return `AUTH-${padded}-${String(hash).padStart(5, "0")}`;
};

export default function AuthorProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authorToken");

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalBooks: 0, published: 0, totalEarnings: 0 });
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "", location: "", genre: "", website: "" });
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/authors/me`, { headers: h }).then(r => r.json()),
      fetch(`${API}/authors/stats`, { headers: h }).then(r => r.json()),
    ]).then(([p, s]) => {
      if (p.success) {
        setProfile(p.author);
        setForm({
          fullName: p.author.fullName || "",
          phone: p.author.phone || "",
          bio: p.author.bio || "",
          location: p.author.location || "",
          genre: p.author.genre || "",
          website: p.author.website || "",
        });
      }
      if (s.success) setStats(s.stats);
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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: "", text: "" });
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch(`${API}/authors/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPwdMsg({ type: "success", text: "Password changed successfully." });
        setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwdMsg({ type: "error", text: data.message || "Failed to change password." });
      }
    } catch {
      setPwdMsg({ type: "error", text: "Could not connect to server." });
    } finally {
      setSavingPwd(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  if (!profile) return (
    <div className="dashboard-workspace">
      <p style={{ color: "#888", padding: 32 }}>Loading profile...</p>
    </div>
  );

  const initials = profile.fullName?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "A";

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Profile & Settings</h1>
          <div className="dashboard-date">Manage your author account and preferences</div>
        </div>
      </div>

      {/* ── Profile Hero Card ── */}
      <div style={{
        background: "white", borderRadius: 14, padding: "28px 32px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap"
      }}>
        {/* Avatar */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%",
            background: avatarPreview ? "transparent" : "linear-gradient(135deg,#3b5723,#527a30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 32, fontWeight: 800, overflow: "hidden",
            border: "3px solid #e8f0e3"
          }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <label style={{
            position: "absolute", bottom: 0, right: 0, width: 26, height: 26,
            background: "#3b5723", borderRadius: "50%", display: "flex",
            alignItems: "center", justifyContent: "center", cursor: "pointer",
            border: "2px solid white", fontSize: 12, color: "white"
          }} title="Change photo">
            ✎
            <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          </label>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1a2912", marginBottom: 3 }}>
            {profile.fullName}
          </div>
          <div style={{ fontSize: 13, color: "#6c757d", marginBottom: 4 }}>{profile.email}</div>
          {profile.bio && (
            <div style={{ fontSize: 13, color: "#555", maxWidth: 420, lineHeight: 1.5 }}>{profile.bio}</div>
          )}
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 6, fontFamily: "monospace", letterSpacing: 0.5 }}>
            {formatAuthorId(profile.author_id)}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 28, flexShrink: 0 }}>
          {[
            { label: "Books", value: stats.totalBooks },
            { label: "Published", value: stats.published },
            { label: "Earnings", value: `Rs. ${(stats.totalEarnings || 0).toLocaleString()}` },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1a2912" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Edit Profile Form ── */}
      <div style={{
        background: "white", borderRadius: 14, padding: "28px 32px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 24
      }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#1a2912" }}>Edit Profile</h2>

        {msg.text && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
            background: msg.type === "success" ? "#d4edda" : "#f8d7da",
            color: msg.type === "success" ? "#155724" : "#721c24"
          }}>{msg.text}</div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              { label: "Full Name *", key: "fullName", placeholder: "Your full name" },
              { label: "Phone", key: "phone", placeholder: "+977-98XXXXXXXX" },
              { label: "Location", key: "location", placeholder: "e.g., Kathmandu, Nepal" },
              { label: "Writing Genre", key: "genre", placeholder: "e.g., Fiction, Poetry" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>{f.label}</label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.key === "fullName"}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd",
                    borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>Email Address</label>
            <input value={profile.email} readOnly
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #eee",
                borderRadius: 8, fontSize: 13, background: "#f9f9f9", color: "#999", boxSizing: "border-box" }} />
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#aaa" }}>Email cannot be changed.</p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>Website / Social Link</label>
            <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd",
                borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>Author Bio</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              rows={4} placeholder="Tell readers about yourself, your writing style, and experience..."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd",
                borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>

          <button type="submit" disabled={saving}
            style={{ padding: "11px 28px", background: "#3b5723", color: "white",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* ── Change Password ── */}
      <div style={{
        background: "white", borderRadius: 14, padding: "28px 32px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.07)"
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#1a2912" }}>Change Password</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>Keep your account secure with a strong password.</p>

        {pwdMsg.text && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13,
            background: pwdMsg.type === "success" ? "#d4edda" : "#f8d7da",
            color: pwdMsg.type === "success" ? "#155724" : "#721c24"
          }}>{pwdMsg.text}</div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Current Password", key: "currentPassword", show: "current" },
              { label: "New Password", key: "newPassword", show: "new" },
              { label: "Confirm New Password", key: "confirmPassword", show: "confirm" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd[f.show] ? "text" : "password"}
                    value={pwdForm[f.key]}
                    onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required
                    style={{ width: "100%", padding: "10px 36px 10px 12px", border: "1px solid #ddd",
                      borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                  <button type="button"
                    onClick={() => setShowPwd(p => ({ ...p, [f.show]: !p[f.show] }))}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14 }}>
                    {showPwd[f.show] ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="submit" disabled={savingPwd}
            style={{ padding: "11px 28px", background: "#1a2912", color: "white",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {savingPwd ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
