import { useState } from "react";

export default function Sales() {
  const [viewMode, setViewMode] = useState("daily"); // daily or monthly

  const dailySales = [
    { date: "2024-02-22", book: "Summer Love", type: "Buy", amount: 299, royalty: 209, buyer: "r***@gmail.com" },
    { date: "2024-02-22", book: "Karnali Blues", type: "Rent", amount: 99, royalty: 69, buyer: "s***@yahoo.com" },
    { date: "2024-02-21", book: "Summer Love", type: "Buy", amount: 299, royalty: 209, buyer: "a***@hotmail.com" },
    { date: "2024-02-21", book: "Mountain Stories", type: "Rent", amount: 79, royalty: 55, buyer: "p***@gmail.com" },
    { date: "2024-02-20", book: "Palpasa Café", type: "Buy", amount: 249, royalty: 174, buyer: "m***@outlook.com" },
    { date: "2024-02-20", book: "Summer Love", type: "Rent", amount: 99, royalty: 69, buyer: "k***@gmail.com" },
    { date: "2024-02-19", book: "Karnali Blues", type: "Buy", amount: 279, royalty: 195, buyer: "n***@yahoo.com" },
    { date: "2024-02-19", book: "Mountain Stories", type: "Buy", amount: 199, royalty: 139, buyer: "b***@gmail.com" },
    { date: "2024-02-18", book: "Palpasa Café", type: "Rent", amount: 89, royalty: 62, buyer: "d***@hotmail.com" },
    { date: "2024-02-18", book: "Summer Love", type: "Buy", amount: 299, royalty: 209, buyer: "t***@gmail.com" }
  ];

  const monthlySales = [
    { month: "February 2024", totalSales: 42, totalRevenue: 8960, totalRoyalty: 6272 },
    { month: "January 2024", totalSales: 38, totalRevenue: 7820, totalRoyalty: 5474 },
    { month: "December 2023", totalSales: 35, totalRevenue: 7140, totalRoyalty: 4998 },
    { month: "November 2023", totalSales: 29, totalRevenue: 5980, totalRoyalty: 4186 }
  ];

  // Earnings trend data (last 7 days)
  const earningsTrend = [
    { day: "Feb 16", earnings: 418 },
    { day: "Feb 17", earnings: 556 },
    { day: "Feb 18", earnings: 487 },
    { day: "Feb 19", earnings: 695 },
    { day: "Feb 20", earnings: 521 },
    { day: "Feb 21", earnings: 743 },
    { day: "Feb 22", earnings: 627 }
  ];

  // Monthly earnings trend
  const monthlyEarningsTrend = [
    { month: "Oct", earnings: 3840 },
    { month: "Nov", earnings: 4186 },
    { month: "Dec", earnings: 4998 },
    { month: "Jan", earnings: 5474 },
    { month: "Feb", earnings: 6272 }
  ];

  // Sales breakdown
  const salesBreakdown = {
    buy: 28,
    rent: 14
  };

  const totalSales = salesBreakdown.buy + salesBreakdown.rent;
  const buyPercentage = Math.round((salesBreakdown.buy / totalSales) * 100);
  const rentPercentage = Math.round((salesBreakdown.rent / totalSales) * 100);

  // Revenue distribution
  const revenueDistribution = {
    buy: 6720, // 75%
    rent: 2240  // 25%
  };

  const totalRevenue = revenueDistribution.buy + revenueDistribution.rent;
  const buyRevenuePercentage = Math.round((revenueDistribution.buy / totalRevenue) * 100);
  const rentRevenuePercentage = Math.round((revenueDistribution.rent / totalRevenue) * 100);

  const totalEarnings = 15420;
  const pendingPayout = 6272;
  const thisMonthSales = 42;
  const thisMonthEarnings = 6272;

  const maxEarnings = viewMode === "daily" 
    ? Math.max(...earningsTrend.map(d => d.earnings))
    : Math.max(...monthlyEarningsTrend.map(d => d.earnings));

  const currentTrend = viewMode === "daily" ? earningsTrend : monthlyEarningsTrend;

  return (
    <div className="dashboard-workspace">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Sales & Earnings</h1>
          <div className="dashboard-date">Track your book sales and royalty earnings</div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="dashboard-stats">
        <div className="stat-box">
          <div className="stat-label">Total Earnings</div>
          <div className="stat-value">Rs. {totalEarnings.toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Pending Payout</div>
          <div className="stat-value">Rs. {pendingPayout.toLocaleString()}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">This Month Sales</div>
          <div className="stat-value">{thisMonthSales}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">This Month Earnings</div>
          <div className="stat-value">Rs. {thisMonthEarnings.toLocaleString()}</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === "daily" ? "active" : ""}`}
          onClick={() => setViewMode("daily")}
        >
          Daily View
        </button>
        <button 
          className={`toggle-btn ${viewMode === "monthly" ? "active" : ""}`}
          onClick={() => setViewMode("monthly")}
        >
          Monthly View
        </button>
      </div>

      {/* Analytics Charts */}
      <div className="analytics-grid">
        {/* Earnings Over Time - Professional Area Chart */}
        <div className="chart-container chart-large">
          <div className="chart-header">
            <h3 className="chart-title">Earnings Over Time</h3>
            <div className="chart-subtitle">
              {viewMode === "daily" ? "Last 7 Days" : "Last 5 Months"}
            </div>
          </div>
          <div className="area-chart-wrapper">
            <div className="area-chart-y-axis">
              {[maxEarnings, Math.round(maxEarnings * 0.75), Math.round(maxEarnings * 0.5), Math.round(maxEarnings * 0.25), 0].map((value, i) => (
                <span key={i} className="area-y-label">Rs. {value.toLocaleString()}</span>
              ))}
            </div>
            <div className="area-chart-canvas">
              <svg className="area-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="100"
                    y2={y}
                    stroke="#f1f3f4"
                    strokeWidth="0.15"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                
                {/* Gradient */}
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b5723" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#3b5723" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Area */}
                <path
                  d={`
                    M 0 100
                    ${currentTrend.map((data, index) => {
                      const x = (index / (currentTrend.length - 1)) * 100;
                      const y = 100 - ((data.earnings / maxEarnings) * 100);
                      return `L ${x} ${y}`;
                    }).join(' ')}
                    L 100 100 Z
                  `}
                  fill="url(#chartGradient)"
                />
                
                {/* Line */}
                <path
                  d={currentTrend.map((data, index) => {
                    const x = (index / (currentTrend.length - 1)) * 100;
                    const y = 100 - ((data.earnings / maxEarnings) * 100);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b5723"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                
                {/* Points */}
                {currentTrend.map((data, index) => {
                  const x = (index / (currentTrend.length - 1)) * 100;
                  const y = 100 - ((data.earnings / maxEarnings) * 100);
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="1.8"
                      fill="#3b5723"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
              <div className="area-chart-x-axis">
                {currentTrend.map((data, index) => (
                  <div key={index} className="area-x-item">
                    <span className="area-x-label">{viewMode === "daily" ? data.day : data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Breakdown */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Sales Breakdown</h3>
            <div className="chart-subtitle">Transaction Types</div>
          </div>
          <div className="breakdown-chart">
            <div className="breakdown-item">
              <div className="breakdown-top">
                <div className="breakdown-label">
                  <span className="breakdown-dot buy-dot"></span>
                  <span className="breakdown-name">Buy</span>
                </div>
                <div className="breakdown-value">{salesBreakdown.buy}</div>
              </div>
              <div className="breakdown-bar-wrapper">
                <div className="breakdown-bar" style={{ width: `${buyPercentage}%`, background: '#3b5723' }}></div>
              </div>
              <div className="breakdown-percent">{buyPercentage}%</div>
            </div>
            
            <div className="breakdown-item">
              <div className="breakdown-top">
                <div className="breakdown-label">
                  <span className="breakdown-dot rent-dot"></span>
                  <span className="breakdown-name">Rent</span>
                </div>
                <div className="breakdown-value">{salesBreakdown.rent}</div>
              </div>
              <div className="breakdown-bar-wrapper">
                <div className="breakdown-bar" style={{ width: `${rentPercentage}%`, background: '#8b9a8d' }}></div>
              </div>
              <div className="breakdown-percent">{rentPercentage}%</div>
            </div>
          </div>
        </div>

        {/* Revenue Split */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Revenue Split</h3>
            <div className="chart-subtitle">By Type</div>
          </div>
          <div className="revenue-chart">
            <div className="revenue-donut">
              <svg viewBox="0 0 100 100" className="revenue-svg">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#f1f3f4"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b5723"
                  strokeWidth="12"
                  strokeDasharray={`${buyRevenuePercentage * 2.513} ${(100 - buyRevenuePercentage) * 2.513}`}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
              </svg>
              <div className="revenue-center">
                <div className="revenue-percent">{buyRevenuePercentage}%</div>
                <div className="revenue-label">Buy</div>
              </div>
            </div>
            <div className="revenue-legend">
              <div className="revenue-item">
                <div className="revenue-item-top">
                  <span className="revenue-dot buy-dot"></span>
                  <span className="revenue-name">Buy</span>
                </div>
                <div className="revenue-amount">Rs. {revenueDistribution.buy.toLocaleString()}</div>
                <div className="revenue-percentage">{buyRevenuePercentage}%</div>
              </div>
              <div className="revenue-item">
                <div className="revenue-item-top">
                  <span className="revenue-dot rent-dot"></span>
                  <span className="revenue-name">Rent</span>
                </div>
                <div className="revenue-amount">Rs. {revenueDistribution.rent.toLocaleString()}</div>
                <div className="revenue-percentage">{rentRevenuePercentage}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            {viewMode === "daily" ? "Recent Transactions" : "Monthly Summary"}
          </h2>
        </div>
        <div className="sales-table-container">
          {viewMode === "daily" ? (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Book</th>
                  <th>Type</th>
                  <th>Buyer</th>
                  <th>Amount</th>
                  <th>Your Royalty</th>
                </tr>
              </thead>
              <tbody>
                {dailySales.map((sale, index) => (
                  <tr key={index}>
                    <td>
                      <div className="table-date">{sale.date}</div>
                    </td>
                    <td>
                      <div className="table-book-name">{sale.book}</div>
                    </td>
                    <td>
                      <span className={`transaction-type ${sale.type.toLowerCase()}`}>
                        {sale.type}
                      </span>
                    </td>
                    <td>
                      <div className="table-buyer">{sale.buyer}</div>
                    </td>
                    <td>
                      <div className="table-amount">Rs. {sale.amount}</div>
                    </td>
                    <td>
                      <div className="table-royalty">Rs. {sale.royalty}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Sales</th>
                  <th>Total Revenue</th>
                  <th>Your Royalty (70%)</th>
                </tr>
              </thead>
              <tbody>
                {monthlySales.map((month, index) => (
                  <tr key={index}>
                    <td>
                      <div className="table-book-name">{month.month}</div>
                    </td>
                    <td>
                      <div className="table-amount">{month.totalSales}</div>
                    </td>
                    <td>
                      <div className="table-amount">Rs. {month.totalRevenue.toLocaleString()}</div>
                    </td>
                    <td>
                      <div className="table-royalty">Rs. {month.totalRoyalty.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Royalty Info */}
      <div className="royalty-info">
        <div className="info-box">
          <h3 className="info-title">Royalty Structure</h3>
          <p className="info-text">You earn 70% royalty on all sales (Buy & Rent). Pustakyatra retains 30% as platform fee.</p>
        </div>
        <div className="info-box">
          <h3 className="info-title">Payout Schedule</h3>
          <p className="info-text">Earnings are paid out monthly on the 5th of each month to your registered bank account.</p>
        </div>
      </div>
    </div>
  );
}
