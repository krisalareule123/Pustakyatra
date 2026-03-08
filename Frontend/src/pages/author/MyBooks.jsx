import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MyBooks() {
  const navigate = useNavigate();
  
  // Mock data for demonstration
  const [books, setBooks] = useState([
    {
      id: 1,
      title: "Summer Love",
      status: "Published",
      views: 1247,
      sales: 42,
      earnings: 2840,
      lastUpdated: "2 hours ago"
    },
    {
      id: 2,
      title: "Karnali Blues",
      status: "Published", 
      views: 892,
      sales: 28,
      earnings: 1980,
      lastUpdated: "1 day ago"
    },
    {
      id: 3,
      title: "New Novel",
      status: "Draft",
      views: 0,
      sales: 0,
      earnings: 0,
      lastUpdated: "1 week ago"
    },
    {
      id: 4,
      title: "Mountain Stories",
      status: "Published",
      views: 634,
      sales: 19,
      earnings: 1420,
      lastUpdated: "3 days ago"
    },
    {
      id: 5,
      title: "Palpasa Café",
      status: "Published",
      views: 523,
      sales: 15,
      earnings: 1180,
      lastUpdated: "5 days ago"
    }
  ]);

  const handleEdit = (bookId) => {
    console.log("Edit book:", bookId);
    // Navigate to edit page or open edit modal
  };

  const handleDelete = (bookId) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      setBooks(books.filter(book => book.id !== bookId));
    }
  };

  const handleView = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">My Books</h1>
          <div className="dashboard-date">Manage your published and draft books</div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/author/add-book')}>
          + Add New Book
        </button>
      </div>

      <div className="dashboard-section">
        <div className="books-table-container">
          <table className="books-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Views</th>
                <th>Sales</th>
                <th>Earnings</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>
                    <div className="book-title-cell">{book.title}</div>
                  </td>
                  <td>
                    <span className={`status-indicator ${book.status.toLowerCase()}`}>
                      {book.status}
                    </span>
                  </td>
                  <td>
                    <div className="metric-value">{book.views.toLocaleString()}</div>
                  </td>
                  <td>
                    <div className="metric-value">{book.sales}</div>
                  </td>
                  <td>
                    <div className="metric-value">Rs. {book.earnings.toLocaleString()}</div>
                  </td>
                  <td>
                    <div className="time-value">{book.lastUpdated}</div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="action-btn-small view" 
                        onClick={() => handleView(book.id)}
                        title="View"
                      >
                        View
                      </button>
                      <button 
                        className="action-btn-small edit" 
                        onClick={() => handleEdit(book.id)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button 
                        className="action-btn-small delete" 
                        onClick={() => handleDelete(book.id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="books-summary">
        <div className="summary-item">
          <div className="summary-label">Total Books</div>
          <div className="summary-value">{books.length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Published</div>
          <div className="summary-value">{books.filter(b => b.status === "Published").length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Drafts</div>
          <div className="summary-value">{books.filter(b => b.status === "Draft").length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Total Earnings</div>
          <div className="summary-value">Rs. {books.reduce((sum, b) => sum + b.earnings, 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}