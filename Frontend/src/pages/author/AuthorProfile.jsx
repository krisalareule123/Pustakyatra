import { useState } from "react";

export default function AuthorProfile() {
  const [profile, setProfile] = useState({
    name: "John Doe",
    displayName: "J. Doe",
    email: "john.doe@example.com",
    bio: "Passionate writer with over 5 years of experience in fiction and non-fiction writing.",
    profilePicture: null,
    joinedDate: "January 15, 2023",
    totalBooks: 5,
    totalEarnings: 15420,
    accountStatus: "Active"
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [previewImage, setPreviewImage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    console.log("Profile saved:", profile);
    alert("Profile updated successfully!");
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    console.log("Password updated");
    alert("Password updated successfully!");
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Profile & Settings</h1>
          <div className="dashboard-date">Manage your account information and security</div>
        </div>
      </div>

      {/* Account Summary Cards */}
      <div className="profile-summary-grid">
        <div className="profile-summary-card">
          <div className="summary-card-icon">📅</div>
          <div className="summary-card-content">
            <div className="summary-card-label">Member Since</div>
            <div className="summary-card-value">{profile.joinedDate}</div>
          </div>
        </div>
        <div className="profile-summary-card">
          <div className="summary-card-icon">📚</div>
          <div className="summary-card-content">
            <div className="summary-card-label">Books Published</div>
            <div className="summary-card-value">{profile.totalBooks}</div>
          </div>
        </div>
        <div className="profile-summary-card">
          <div className="summary-card-icon">💰</div>
          <div className="summary-card-content">
            <div className="summary-card-label">Total Earnings</div>
            <div className="summary-card-value">Rs. {profile.totalEarnings.toLocaleString()}</div>
          </div>
        </div>
        <div className="profile-summary-card">
          <div className="summary-card-icon">✓</div>
          <div className="summary-card-content">
            <div className="summary-card-label">Account Status</div>
            <div className="summary-card-value status-active">{profile.accountStatus}</div>
          </div>
        </div>
      </div>

      {/* Profile Information Section */}
      <div className="profile-settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Profile Information</h2>
          <p className="settings-section-subtitle">Update your author profile and public information</p>
        </div>
        
        <form onSubmit={handleSaveProfile} className="settings-form">
          {/* Profile Picture Upload */}
          <div className="profile-picture-upload-section">
            <div className="profile-picture-preview">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="profile-picture-img" />
              ) : (
                <div className="profile-picture-placeholder-large">
                  {profile.name.split(' ').map(word => word[0]).join('')}
                </div>
              )}
            </div>
            <div className="profile-picture-upload-info">
              <h3 className="upload-info-title">Profile Picture</h3>
              <p className="upload-info-text">Upload a professional photo. This will be visible to readers.</p>
              <div className="upload-actions">
                <label htmlFor="profile-picture-input" className="upload-btn">
                  Choose File
                </label>
                <input
                  type="file"
                  id="profile-picture-input"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {previewImage && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => setPreviewImage(null)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="upload-hint">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="settings-form-grid">
            <div className="settings-form-group">
              <label htmlFor="name" className="settings-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="settings-input"
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="settings-form-group">
              <label htmlFor="displayName" className="settings-label">Author Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={profile.displayName}
                onChange={handleInputChange}
                className="settings-input"
                placeholder="Name shown to readers"
              />
            </div>
          </div>

          <div className="settings-form-group">
            <label htmlFor="email" className="settings-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              className="settings-input readonly"
              readOnly
            />
            <p className="settings-hint">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div className="settings-form-group">
            <label htmlFor="bio" className="settings-label">Author Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleInputChange}
              className="settings-textarea"
              rows="5"
              placeholder="Tell readers about yourself, your writing style, and experience..."
            />
            <p className="settings-hint">This will be displayed on your author page. {profile.bio.length}/500 characters</p>
          </div>

          <div className="settings-form-actions">
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
            <button type="button" className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Password & Security Section */}
      <div className="profile-settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">Password & Security</h2>
          <p className="settings-section-subtitle">Update your password to keep your account secure</p>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="settings-form">
          <div className="settings-form-group">
            <label htmlFor="currentPassword" className="settings-label">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className="settings-input"
              placeholder="Enter current password"
            />
          </div>

          <div className="settings-form-grid">
            <div className="settings-form-group">
              <label htmlFor="newPassword" className="settings-label">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className="settings-input"
                placeholder="Enter new password"
              />
            </div>
            
            <div className="settings-form-group">
              <label htmlFor="confirmPassword" className="settings-label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className="settings-input"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="password-requirements">
            <p className="requirements-title">Password Requirements:</p>
            <ul className="requirements-list">
              <li>At least 8 characters long</li>
              <li>Contains uppercase and lowercase letters</li>
              <li>Contains at least one number</li>
              <li>Contains at least one special character</li>
            </ul>
          </div>

          <div className="settings-form-actions">
            <button type="submit" className="btn-primary">
              Update Password
            </button>
            <button type="button" className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}