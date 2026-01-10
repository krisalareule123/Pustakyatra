import { useState, useEffect } from "react";
import "./Pages.css";

export default function MyAccount() {
  const [user, setUser] = useState({
    fullName: "Demo User",
    email: "demo@example.com",
    phone: "+977-98XXXXXXX",
  });

  const [active, setActive] = useState("dashboard"); // dashboard | details | password | download | edit | settings

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(prevUser => ({
        ...prevUser,
        fullName: parsedUser.fullName || prevUser.fullName,
        email: parsedUser.email || prevUser.email,
      }));
    }
  }, []);

  return (
    <div className="pageWrap">
      {/* Top small breadcrumb */}
      <div className="accBreadcrumb">
        <span>Home</span>
        <span className="accCrumbSep">|</span>
        <span>my-account</span>
      </div>

      <section className="accShell">
        {/* LEFT SIDE */}
        <aside className="accSide">
          <div className="accAvatarBox">
            <img
              className="accAvatarImg"
              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop&q=60"
              alt="Profile"
            />

            <label className="accUploadBtn">
              ⬆ Upload Photo
              <input type="file" accept="image/*" hidden />
            </label>

            <h2 className="accName">{user.fullName}</h2>
          </div>

          <nav className="accMenu">
            <button
              className={`accItem ${active === "dashboard" ? "active" : ""}`}
              onClick={() => setActive("dashboard")}
              type="button"
            >
              <span className="accIcon">🏠</span> Dashboard
            </button>

            <button
              className={`accItem ${active === "details" ? "active" : ""}`}
              onClick={() => setActive("details")}
              type="button"
            >
              <span className="accIcon">👤</span> Account Details
            </button>

            <button
              className={`accItem ${active === "password" ? "active" : ""}`}
              onClick={() => setActive("password")}
              type="button"
            >
              <span className="accIcon">🔒</span> Change Password
            </button>

            <button
              className={`accItem ${active === "download" ? "active" : ""}`}
              onClick={() => setActive("download")}
              type="button"
            >
              <span className="accIcon">⬇️</span> Download
            </button>

            <button
              className={`accItem ${active === "edit" ? "active" : ""}`}
              onClick={() => setActive("edit")}
              type="button"
            >
              <span className="accIcon">✏️</span> Edit Profile
            </button>

            <button
              className={`accItem ${active === "settings" ? "active" : ""}`}
              onClick={() => setActive("settings")}
              type="button"
            >
              <span className="accIcon">⚙️</span> Settings
            </button>

            <button
              className="accItem danger"
              onClick={() => alert("Logout (demo)")}
              type="button"
            >
              <span className="accIcon">🚪</span> Logout
            </button>
          </nav>
        </aside>

        {/* RIGHT SIDE */}
        <main className="accMain">
          <div className="accCard">
            {active === "dashboard" && (
              <>
                <h1 className="accTitle">Dashboard</h1>
                <p className="accHello">
                  Hello, <b>{user.fullName}</b>
                </p>
                <p className="accText">
                  From your account dashboard, you can easily check & view your recent downloads,
                  manage your account and edit your password and account details.
                </p>
              </>
            )}

            {active === "details" && (
              <>
                <h1 className="accTitle">Account Details</h1>
                <div className="accFormGrid">
                  <div className="accField">
                    <label>Full Name</label>
                    <input defaultValue={user.fullName} />
                  </div>
                  <div className="accField">
                    <label>Email</label>
                    <input defaultValue={user.email} />
                  </div>
                  <div className="accField accFull">
                    <label>Phone</label>
                    <input defaultValue={user.phone} />
                  </div>

                  <button className="btnPrimary accSaveBtn" type="button">
                    Save Changes
                  </button>
                </div>
              </>
            )}

            {active === "password" && (
              <>
                <h1 className="accTitle">Change Password</h1>
                <div className="accFormGrid">
                  <div className="accField accFull">
                    <label>Current Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="accField">
                    <label>New Password</label>
                    <input type="password" placeholder="Minimum 6 characters" />
                  </div>
                  <div className="accField">
                    <label>Confirm Password</label>
                    <input type="password" placeholder="Re-enter new password" />
                  </div>

                  <button className="btnPrimary accSaveBtn" type="button">
                    Update Password
                  </button>
                </div>
              </>
            )}

            {active === "download" && (
              <>
                <h1 className="accTitle">Download</h1>
                <p className="accText">No downloads yet. (Demo)</p>

                <div className="accTable">
                  <div className="accRow head">
                    <span>Book</span>
                    <span>Date</span>
                    <span>Status</span>
                  </div>
                  <div className="accRow">
                    <span>—</span>
                    <span>—</span>
                    <span className="pill">Empty</span>
                  </div>
                </div>
              </>
            )}

            {active === "edit" && (
              <>
                <h1 className="accTitle">Edit Profile</h1>
                <div className="accFormGrid">
                  <div className="accField">
                    <label>Full Name</label>
                    <input defaultValue={user.fullName} />
                  </div>
                  <div className="accField">
                    <label>Email</label>
                    <input defaultValue={user.email} />
                  </div>
                  <div className="accField accFull">
                    <label>Bio</label>
                    <textarea rows={4} placeholder="Write something about you..." />
                  </div>

                  <button className="btnPrimary accSaveBtn" type="button">
                    Save Profile
                  </button>
                </div>
              </>
            )}

            {active === "settings" && (
              <>
                <h1 className="accTitle">Settings</h1>
                <p className="accText">Settings page (demo).</p>
                <div className="accSettings">
                  <label className="accToggle">
                    <input type="checkbox" />
                    <span>Receive email updates</span>
                  </label>
                  <label className="accToggle">
                    <input type="checkbox" />
                    <span>Show recommended books</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </main>
      </section>
    </div>
  );
}
