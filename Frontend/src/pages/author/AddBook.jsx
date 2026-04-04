import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

export default function AddBook() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });
  const [bookData, setBookData] = useState({
    title: "", nepaliTitle: "", description: "", category: "",
    language: "Nepali", keywords: "", buyPrice: "", rentPrice: "",
    rentDays: "15", coverImage: null, bookFile: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files?.[0]) setBookData(prev => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async (e, forcedStatus) => {
    e.preventDefault();
    const token = localStorage.getItem("authorToken");
    if (!token) { navigate("/login"); return; }
    if (!bookData.bookFile) {
      setSubmitMsg({ type: "error", text: "Please upload a PDF book file." });
      return;
    }

    setSubmitting(true);
    setSubmitMsg({ type: "", text: "" });

    const status = forcedStatus || "published";
    const formData = new FormData();
    formData.append("title", bookData.title);
    formData.append("nepaliTitle", bookData.nepaliTitle);
    formData.append("description", bookData.description);
    formData.append("category", bookData.category);
    formData.append("language", bookData.language);
    formData.append("keywords", bookData.keywords);
    formData.append("buyPrice", bookData.buyPrice);
    formData.append("rentPrice", bookData.rentPrice);
    formData.append("rentDays", bookData.rentDays);
    formData.append("status", status);
    if (bookData.coverImage) formData.append("coverImage", bookData.coverImage);
    formData.append("bookFile", bookData.bookFile);

    try {
      const res = await fetch(`${API}/books`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMsg({
          type: "success",
          text: `Book ${status === "draft" ? "saved as draft" : "published"} successfully!`
        });
        setBookData({
          title: "", nepaliTitle: "", description: "", category: "",
          language: "Nepali", keywords: "", buyPrice: "", rentPrice: "",
          rentDays: "15", coverImage: null, bookFile: null
        });
        setTimeout(() => navigate("/author/books"), 1500);
      } else {
        setSubmitMsg({ type: "error", text: data.message || "Failed to publish book." });
      }
    } catch (err) {
      setSubmitMsg({ type: "error", text: "Upload failed: " + err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Add New Book</h1>
        <div className="dashboard-date">Upload and publish your book to Pustakyatra</div>
      </div>

      {submitMsg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 16,
          background: submitMsg.type === "success" ? "#d4edda" : "#f8d7da",
          color: submitMsg.type === "success" ? "#155724" : "#721c24"
        }}>
          {submitMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="book-form">

        <div className="form-section">
          <h3 className="form-section-title">Book Information</h3>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="title">Book Title (English) *</label>
              <input type="text" id="title" name="title" value={bookData.title}
                onChange={handleInputChange} className="form-control" required />
            </div>
            <div className="form-field">
              <label htmlFor="nepaliTitle">Book Title (Nepali)</label>
              <input type="text" id="nepaliTitle" name="nepaliTitle" value={bookData.nepaliTitle}
                onChange={handleInputChange} className="form-control" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="description">Description *</label>
            <textarea id="description" name="description" value={bookData.description}
              onChange={handleInputChange} className="form-control" rows="5"
              placeholder="Provide a detailed description of your book..." required />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="category">Category *</label>
              <select id="category" name="category" value={bookData.category}
                onChange={handleInputChange} className="form-control" required>
                <option value="">Select Category</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Poetry">Poetry</option>
                <option value="Biography">Biography</option>
                <option value="History">History</option>
                <option value="Self-Help">Self-Help</option>
                <option value="Children">Children&apos;s Books</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="language">Language *</label>
              <select id="language" name="language" value={bookData.language}
                onChange={handleInputChange} className="form-control" required>
                <option value="Nepali">Nepali</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="keywords">Keywords (comma separated)</label>
            <input type="text" id="keywords" name="keywords" value={bookData.keywords}
              onChange={handleInputChange} className="form-control"
              placeholder="e.g., romance, love story, nepali literature" />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Pricing</h3>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="buyPrice">Buy Price (Rs.) *</label>
              <input type="number" id="buyPrice" name="buyPrice" value={bookData.buyPrice}
                onChange={handleInputChange} className="form-control" placeholder="299" required />
              <small className="form-hint">Lifetime access for readers</small>
            </div>
            <div className="form-field">
              <label htmlFor="rentPrice">Rent Price (Rs.) *</label>
              <input type="number" id="rentPrice" name="rentPrice" value={bookData.rentPrice}
                onChange={handleInputChange} className="form-control" placeholder="99" required />
              <small className="form-hint">Temporary access for readers</small>
            </div>
            <div className="form-field">
              <label htmlFor="rentDays">Rent Duration *</label>
              <select id="rentDays" name="rentDays" value={bookData.rentDays}
                onChange={handleInputChange} className="form-control" required>
                <option value="7">7 Days</option>
                <option value="15">15 Days</option>
                <option value="30">30 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Files</h3>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="coverImage">Cover Image</label>
              <input type="file" id="coverImage" name="coverImage"
                onChange={handleFileChange} className="form-control-file" accept="image/*" />
              <small className="form-hint">JPG, PNG. Max 2MB. Recommended: 600x900px</small>
            </div>
            <div className="form-field">
              <label htmlFor="bookFile">Book PDF *</label>
              <input type="file" id="bookFile" name="bookFile"
                onChange={handleFileChange} className="form-control-file" accept=".pdf" required />
              <small className="form-hint">PDF only. Max 50MB</small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Publishing..." : "Publish Book"}
          </button>
          <button type="button" className="btn-secondary" disabled={submitting}
            onClick={(e) => handleSubmit(e, "draft")}>
            Save as Draft
          </button>
          <button type="button" className="btn-text" onClick={() => navigate("/author/books")}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
