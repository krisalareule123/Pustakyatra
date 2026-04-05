import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function MyBooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(null); // bookId being published

  const token = localStorage.getItem("authorToken");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    fetch(`${API}/authors/books`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setBooks(data.books);
        else setError(data.message || "Failed to load books");
      })
      .catch(() => setError("Could not connect to server"))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handlePublish = async (bookId) => {
    setPublishing(bookId);
    try {
      const res = await fetch(`${API}/books/${bookId}/publish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooks(prev => prev.map(b =>
          b.book_id === bookId ? { ...b, status: "published" } : b
        ));
      } else {
        alert(data.message || "Failed to publish");
      }
    } catch {
      alert("Could not connect to server");
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm("Delete this book? This cannot be undone.")) return;
    setBooks(prev => prev.filter(b => b.book_id !== bookId));
  };

  const totalEarnings = books.reduce((s, b) => s + parseFloat(b.earnings || 0), 0);

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">My Books</h1>
          <div className="dashboard-date">Manage your published and draft books</div>
        </div>
        <button className="btn-primary" onClick={() => navigate("/author/add-book")}>
          + Add New Book
        </button>
      </div>

      {error && <div style={{ color: "#721c24", background: "#f8d7da", padding: "12px 16px", borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <p style={{ color: "#888", padding: "24px 0" }}>Loading your books...</p>
      ) : books.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <p style={{ fontSize: 17, fontWeight: 600, color: "#1a2912", margin: "0 0 6px" }}>You have not uploaded any books yet.</p>
          <p style={{ color: "#888", margin: "0 0 20px" }}>Start by adding your first book.</p>
          <button className="btn-primary" onClick={() => navigate("/author/add-book")}>+ Add Your First Book</button>
        </div>
      ) : (
        <>
          <div className="dashboard-section">
            <div className="books-table-container">
              <table className="books-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Sales</th>
                    <th>Earnings</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(book => (
                    <tr key={book.book_id}>
                      <td><div className="book-title-cell">{book.title}</div></td>
                      <td>
                        <span className={`status-indicator ${book.status}`}>{book.status}</span>
                      </td>
                      <td><div className="metric-value">{book.sales}</div></td>
                      <td><div className="metric-value">Rs. {parseFloat(book.earnings).toLocaleString()}</div></td>
                      <td><div className="time-value">{fmtDate(book.created_at)}</div></td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn-small edit"
                            onClick={() => navigate(`/author/add-book?edit=${book.book_id}`)}
                          >
                            Edit
                          </button>
                          {book.status === "draft" && (
                            <button
                              className="action-btn-small"
                              style={{ background: "#3b5723", color: "white", border: "none" }}
                              onClick={() => handlePublish(book.book_id)}
                              disabled={publishing === book.book_id}
                            >
                              {publishing === book.book_id ? "..." : "Publish"}
                            </button>
                          )}
                          <button className="action-btn-small delete" onClick={() => handleDelete(book.book_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="books-summary">
            <div className="summary-item">
              <div className="summary-label">Total Books</div>
              <div className="summary-value">{books.length}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Published</div>
              <div className="summary-value">{books.filter(b => b.status === "published").length}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Drafts</div>
              <div className="summary-value">{books.filter(b => b.status === "draft").length}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Earnings</div>
              <div className="summary-value">Rs. {totalEarnings.toLocaleString()}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
