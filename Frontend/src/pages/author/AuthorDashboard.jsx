import { useState, useEffect } from "react";
import "../../pages/Pages.css";

export default function AuthorDashboard() {
  const [authorStats, setAuthorStats] = useState({
    totalBooks: 0,
    totalViews: 0,
    draftBooks: 0,
    totalEarnings: 0
  });

  const [bookPerformance, setBookPerformance] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Load author stats (mock data for now)
    setAuthorStats({
      totalBooks: 8,
      totalViews: 12547,
      draftBooks: 3,
      totalEarnings: 15420
    });

    // Book performance data
    setBookPerformance([
      { 
        id: 1, 
        title: "Summer Love", 
        status: "Published", 
        views: 1247, 
        earnings: 2840, 
        lastUpdated: "2 hours ago" 
      },
      { 
        id: 2, 
        title: "Karnali Blues", 
        status: "Published", 
        views: 892, 
        earnings: 1980, 
        lastUpdated: "1 day ago" 
      },
      { 
        id: 3, 
        title: "Mountain Stories", 
        status: "Published", 
        views: 634, 
        earnings: 1420, 
        lastUpdated: "3 days ago" 
      },
      { 
        id: 4, 
        title: "Palpasa Café", 
        status: "Published", 
        views: 523, 
        earnings: 1180, 
        lastUpdated: "5 days ago" 
      },
      { 
        id: 5, 
        title: "New Novel", 
        status: "Draft", 
        views: 0, 
        earnings: 0, 
        lastUpdated: "1 week ago" 
      }
    ]);

    setRecentActivity([
      { id: 1, action: "Book purchased", book: "Summer Love", time: "2 min ago" },
      { id: 2, action: "Review received", book: "Karnali Blues", time: "1 hour ago" },
      { id: 3, action: "Book viewed", book: "Mountain Stories", time: "2 hours ago" },
      { id: 4, action: "Draft updated", book: "New Novel", time: "3 hours ago" },
      { id: 5, action: "Book purchased", book: "Palpasa Café", time: "5 hours ago" }
    ]);
  }, []);

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-date">Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* Compact Stats */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-label">Books</div>
          <div className="stat-value">{authorStats.totalBooks}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Views</div>
          <div className="stat-value">{authorStats.totalViews.toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Drafts</div>
          <div className="stat-value">{authorStats.draftBooks}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Earnings</div>
          <div className="stat-value">Rs. {authorStats.totalEarnings.toLocaleString()}</div>
        </div>
      </div>

      {/* Book Performance Table */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Book Performance</h2>
        </div>
        <div className="performance-table-container">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Views</th>
                <th>Earnings</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {bookPerformance.map((book) => (
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
                    <div className="metric-value">Rs. {book.earnings.toLocaleString()}</div>
                  </td>
                  <td>
                    <div className="time-value">{book.lastUpdated}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Activity Feed */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
        </div>
        <div className="activity-feed">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-row">
              <div className="activity-info">
                <span className="activity-action">{activity.action}</span>
                <span className="activity-book">"{activity.book}"</span>
              </div>
              <div className="activity-time">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}