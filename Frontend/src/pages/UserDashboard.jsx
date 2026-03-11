import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { readerAPI } from "../services/api";
import "./Pages.css";

export default function MyAccount() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [active, setActive] = useState("dashboard");

  // Form states for Account Details
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
  });

  // Form states for Change Password
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        
        if (!token) {
          console.log("No token found, redirecting to login");
          navigate("/login");
          return;
        }

        console.log("Fetching profile with token...");
        setLoading(true);
        
        const response = await readerAPI.getProfile(token);
        console.log("Profile response:", response);
        
        if (response.success) {
          const userData = {
            fullName: response.user.fullName || "",
            email: response.user.email || "",
            phone: response.user.phone || "",
            address: response.user.address || "",
          };
          setUser(userData);
          setProfileForm(userData);
          console.log("Profile loaded successfully");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        
        // Try to use localStorage data as fallback
        const storedUserData = localStorage.getItem("userData");
        if (storedUserData) {
          try {
            const parsedUser = JSON.parse(storedUserData);
            const fallbackData = {
              fullName: parsedUser.fullName || "",
              email: parsedUser.email || "",
              phone: parsedUser.phone || "",
              address: parsedUser.address || "",
            };
            setUser(fallbackData);
            setProfileForm(fallbackData);
            console.log("Using localStorage fallback data");
            
            // Show warning but don't block the page
            setMessage({ 
              type: "error", 
              text: "Could not connect to server. Showing cached data. Some features may not work." 
            });
          } catch (parseError) {
            console.error("Failed to parse localStorage data:", parseError);
          }
        } else {
          // Only redirect to login if it's an auth error
          if (error.message && (
            error.message.toLowerCase().includes("token") || 
            error.message.toLowerCase().includes("authentication") || 
            error.message.toLowerCase().includes("unauthorized") ||
            error.message.toLowerCase().includes("access denied")
          )) {
            localStorage.removeItem("token");
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
            navigate("/login");
          } else {
            setMessage({ 
              type: "error", 
              text: "Could not load profile. Please check if the backend server is running." 
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Frontend validation
    if (!profileForm.fullName?.trim() || !profileForm.email?.trim()) {
      setMessage({ type: "error", text: "Please provide full name and email" });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // Trim values before sending
      const profileData = {
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone?.trim() || "",
        address: profileForm.address?.trim() || "",
      };

      const response = await readerAPI.updateProfile(token, profileData);
      
      if (response.success) {
        setUser(profileData);
        setProfileForm(profileData);
        
        // Update localStorage
        const storedUser = JSON.parse(localStorage.getItem("userData") || "{}");
        localStorage.setItem("userData", JSON.stringify({
          ...storedUser,
          fullName: profileData.fullName,
          email: profileData.email,
        }));
        
        // Trigger event to update navbar
        window.dispatchEvent(new Event('userLoggedIn'));
        
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "Please fill in all password fields" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters long" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await readerAPI.changePassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to change password" });
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    
    // Trigger event to update navbar
    window.dispatchEvent(new Event('userLoggedOut'));
    
    navigate("/login");
  };

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
              onClick={handleLogout}
              type="button"
            >
              <span className="accIcon">🚪</span> Logout
            </button>
          </nav>
        </aside>

        {/* RIGHT SIDE */}
        <main className="accMain">
          {loading && active === "dashboard" ? (
            <div className="accCard">
              <p className="accText">Loading profile...</p>
            </div>
          ) : (
            <div className="accCard">
              {active === "dashboard" && (
                <>
                  <h1 className="accTitle">Dashboard</h1>
                  <p className="accHello">
                    Hello, <b>{user.fullName || "User"}</b>
                  </p>
                  <p className="accText">
                    From your account dashboard, you can easily check & view your recent downloads,
                    manage your account and edit your password and account details.
                  </p>
                </>
              )}

              {active === "details" && (
                <>
                  <h1 className="accTitle">Account Settings</h1>
                  
                  {/* Profile Photo Section */}
                  <div className="accSection">
                    <h2 className="accSectionTitle">Profile Photo</h2>
                    <div className="accPhotoSection">
                      <img
                        className="accPhotoPreview"
                        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop&q=60"
                        alt="Profile"
                      />
                      <div className="accPhotoActions">
                        <label className="btnSecondary">
                          Upload New Photo
                          <input type="file" accept="image/*" hidden />
                        </label>
                        <p className="accPhotoHint">JPG, PNG or GIF. Max size 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information Section */}
                  <div className="accSection">
                    <h2 className="accSectionTitle">Profile Information</h2>
                    {message.text && message.type && (
                      <div className={`accMessage ${message.type}`}>
                        {message.text}
                      </div>
                    )}
                    <form onSubmit={handleUpdateProfile}>
                      <div className="accFormGrid">
                        <div className="accField">
                          <label>Full Name <span className="required">*</span></label>
                          <input
                            value={profileForm.fullName}
                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div className="accField">
                          <label>Email Address <span className="required">*</span></label>
                          <input
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <div className="accField">
                          <label>Phone Number</label>
                          <input
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="+977-98XXXXXXX"
                          />
                        </div>
                        <div className="accField">
                          <label>Address</label>
                          <input
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            placeholder="Your address"
                          />
                        </div>
                      </div>
                      <button className="btnPrimary accSaveBtn" type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {active === "password" && (
                <>
                  <h1 className="accTitle">Security Settings</h1>
                  
                  {/* Change Password Section */}
                  <div className="accSection">
                    <h2 className="accSectionTitle">Change Password</h2>
                    <p className="accSectionDesc">Update your password to keep your account secure</p>
                    
                    {message.text && message.type && (
                      <div className={`accMessage ${message.type}`}>
                        {message.text}
                      </div>
                    )}
                    
                    <form onSubmit={handleChangePassword}>
                      <div className="accFormGrid">
                        <div className="accField accFull">
                          <label>Current Password <span className="required">*</span></label>
                          <input
                            type="password"
                            placeholder="Enter current password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="accField">
                          <label>New Password <span className="required">*</span></label>
                          <input
                            type="password"
                            placeholder="Minimum 6 characters"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            required
                          />
                        </div>
                        <div className="accField">
                          <label>Confirm New Password <span className="required">*</span></label>
                          <input
                            type="password"
                            placeholder="Re-enter new password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <button className="btnPrimary accSaveBtn" type="submit" disabled={loading}>
                        {loading ? "Updating..." : "Update Password"}
                      </button>
                    </form>
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
          )}
        </main>
      </section>
    </div>
  );
}
