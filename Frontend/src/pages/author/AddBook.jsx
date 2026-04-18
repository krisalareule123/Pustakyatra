import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = "http://localhost:5001/api";

export default function AddBook() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit"); // book_id if editing, null if creating

  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });
  const [coverPreview, setCoverPreview] = useState(null);
  const [bookData, setBookData] = useState({
    title: "", nepaliTitle: "", description: "", category: "",
    language: "Nepali", keywords: "", buyPrice: "", rentPrice: "",
    rentDays: "15", coverImage: null, bookFile: null, existingPdf: null
  });

  const token = localStorage.getItem("authorToken");

  // Load existing book data when editing
  useEffect(() => {
    if (!editId || !token) return;

    fetch(`${API}/authors/books/${editId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success || !data.book) return;
        const b = data.book;
        setBookData({
          title:       b.title        || "",
          nepaliTitle: b.nepali_title || "",
          description: b.description  || "",
          category:    b.category     || "",
          language:    b.language     || "Nepali",
          keywords:    b.keywords     || "",
          buyPrice:    b.buy_price    != null ? String(b.buy_price)  : "",
          rentPrice:   b.rent_price   != null ? String(b.rent_price) : "",
          rentDays:    b.rent_days    != null ? String(b.rent_days)  : "15",
          coverImage:  null,
          bookFile:    null,
          existingPdf: b.pdf_file     || null,
        });
        if (b.cover_image) {
          setCoverPreview(`http://localhost:5001/${b.cover_image}`);
        }
      })
      .catch(console.error);
  }, [editId, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files?.[0]) {
      setBookData(prev => ({ ...prev, [name]: files[0] }));
      if (name === "coverImage") setCoverPreview(URL.createObjectURL(files[0]));
    }
  };

  const handleSubmit = async (e, forcedStatus) => {
    e.preventDefault();
    if (!token) { navigate("/login"); return; }

    // For new books, PDF is required. For edits, it's optional.
    if (!editId && !bookData.bookFile) {
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
    if (!editId) formData.append("status", status);
    if (bookData.coverImage) formData.append("coverImage", bookData.coverImage);
    if (bookData.bookFile)   formData.append("bookFile", bookData.bookFile);

    const url    = editId ? `${API}/books/${editId}/update` : `${API}/books`;
    const method = editId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMsg({
          type: "success",
          text: editId ? "Book updated successfully!" : `Book ${status === "draft" ? "saved as draft" : "published"} successfully!`
        });
        setTimeout(() => navigate("/author/books"), 1200);
      } else {
        setSubmitMsg({ type: "error", text: data.message || "Failed to save book." });
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
        <h1 className="dashboard-title">{editId ? "Edit Book" : "Add New Book"}</h1>
        <div className="dashboard-date">
          {editId ? "Update your book details" : "Upload and publish your book to Pustakyatra"}
        </div>
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
                <option value="0">5 Minutes (test)</option>
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
              <label htmlFor="coverImage">Cover Image {editId ? "(leave empty to keep current)" : ""}</label>
              <input type="file" id="coverImage" name="coverImage"
                onChange={handleFileChange} className="form-control-file" accept="image/*" />
              {coverPreview && (
                <img src={coverPreview} alt="Cover preview"
                  style={{ marginTop: 8, width: 80, height: 110, objectFit: "cover",
                    borderRadius: 6, border: "1px solid #ddd" }} />
              )}
              <small className="form-hint">JPG, PNG. Max 2MB. Recommended: 600x900px</small>
            </div>
            <div className="form-field">
              <label htmlFor="bookFile">Book PDF {editId ? "(leave empty to keep current)" : "*"}</label>
              <input type="file" id="bookFile" name="bookFile"
                onChange={handleFileChange} className="form-control-file" accept=".pdf"
                required={!editId} />
              {bookData.bookFile ? (
                <small style={{ color: "#3b5723", display: "block", marginTop: 4 }}>
                  ✓ {bookData.bookFile.name} ({(bookData.bookFile.size / 1024 / 1024).toFixed(1)} MB)
                </small>
              ) : bookData.existingPdf ? (
                <small style={{ color: "#6c757d", display: "block", marginTop: 4 }}>
                  Current: {bookData.existingPdf.split("/").pop()}
                </small>
              ) : null}
              <small className="form-hint">PDF only. Max 50MB</small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : editId ? "Save Changes" : "Publish Book"}
          </button>
          {!editId && (
            <button type="button" className="btn-secondary" disabled={submitting}
              onClick={(e) => handleSubmit(e, "draft")}>
              Save as Draft
            </button>
          )}
          <button type="button" className="btn-text" onClick={() => navigate("/author/books")}>
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
