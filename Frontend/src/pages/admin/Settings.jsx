import { useState } from "react";

export default function AdminSettings() {
  const [profile, setProfile] = useState({ name: "Admin", email: "admin@pustakyatra.com" });
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [prefs, setPrefs] = useState({ emailNotifs: true, reviewAlerts: true, paymentAlerts: true });
  const [saved, setSaved] = useState("");

  const save = (section) => {
    setSaved(section);
    setTimeout(() => setSaved(""), 2500);
  };

  const Section = ({ title, sub, children, onSave }) => (
    <div className="admin-card" style={{ marginBottom: 20 }}>
      <div className="admin-card-header">
        <div>
          <h3 className="admin-card-title">{title}</h3>
          {sub && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#888" }}>{sub}</p>}
        </div>
      </div>
      <div style={{ padding: "20px 22px" }}>
        {children}
        <button className="admin-btn admin-btn-primary" style={{ marginTop: 16 }} onClick={onSave}>
          Save Changes
        </button>
        {saved === title && <span style={{ marginLeft: 12, fontSize: 12, color: "#1e6b35", fontWeight: 600 }}>✓ Saved</span>}
      </div>
    </div>
  );

  const Field = ({ label, ...props }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5 }}>{label}</label>
      <input {...props} style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd",
        borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  return (
    <>
      <Section title="Admin Profile" sub="Update your admin account details" onSave={() => save("Admin Profile")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Full Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          <Field label="Email Address" value={profile.email} readOnly style={{ background: "#f9f9f9", color: "#999" }} />
        </div>
      </Section>

      <Section title="Change Password" sub="Keep your admin account secure" onSave={() => save("Change Password")}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <Field label="Current Password" type="password" value={pwd.current} onChange={e => setPwd(p => ({ ...p, current: e.target.value }))} />
          <Field label="New Password"     type="password" value={pwd.newPwd}  onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))} />
          <Field label="Confirm Password" type="password" value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
        </div>
      </Section>

      <Section title="Notification Preferences" sub="Choose which alerts you receive" onSave={() => save("Notification Preferences")}>
        {[
          { key: "emailNotifs",   label: "Email notifications for new registrations" },
          { key: "reviewAlerts",  label: "Alert when a new review is submitted" },
          { key: "paymentAlerts", label: "Alert when a payment is completed" },
        ].map(p => (
          <label key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={prefs[p.key]} onChange={e => setPrefs(prev => ({ ...prev, [p.key]: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "#3b5723" }} />
            <span style={{ fontSize: 13, color: "#333" }}>{p.label}</span>
          </label>
        ))}
      </Section>

      <Section title="System Information" sub="Platform details" onSave={() => {}}>
        {[
          ["Platform", "Pustakyatra — Nepali Digital Library"],
          ["Version",  "1.0.0"],
          ["Backend",  "Node.js + Express + MySQL"],
          ["Payment",  "eSewa v2 Integration"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
            <span style={{ width: 120, color: "#888", fontWeight: 600 }}>{k}</span>
            <span style={{ color: "#333" }}>{v}</span>
          </div>
        ))}
      </Section>
    </>
  );
}
