import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Navbar from "./components/common/Navbar.jsx";
import Footer from "./components/common/Footer.jsx";
import CartPanel from "./components/common/CartPanel.jsx";

import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Payment from "./pages/Payment.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentFailure from "./pages/PaymentFailure.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import MyLibrary from "./pages/MyLibrary.jsx";
import Reader from "./pages/Reader.jsx";

import Browse from "./pages/Browse";
import Categories from "./pages/Categories";
import Authors from "./pages/Authors";
import About from "./pages/About";
import BookDetails from "./pages/BookDetails.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";

// Author Panel
import AuthorLayout from "./components/author/AuthorLayout.jsx";
import AuthorDashboard from "./pages/author/AuthorDashboard.jsx";
import MyBooks from "./pages/author/MyBooks.jsx";
import AddBook from "./pages/author/AddBook.jsx";
import Sales from "./pages/author/Sales.jsx";
import AuthorProfile from "./pages/author/AuthorProfile.jsx";
import AuthorReviews from "./pages/author/Reviews.jsx";
import AuthorNotifications from "./pages/author/Notifications.jsx";

// Admin Panel
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminAuthors from "./pages/admin/Authors.jsx";
import AdminBooks from "./pages/admin/Books.jsx";
import AdminPayments from "./pages/admin/Payments.jsx";
import AdminReviews from "./pages/admin/Reviews.jsx";
import AdminNotifications from "./pages/admin/Notifications.jsx";
import AdminSettings from "./pages/admin/Settings.jsx";
import AdminAnalytics from "./pages/admin/Analytics.jsx";

// Author Layout Wrapper Component
function AuthorLayoutWrapper() {
  return (
    <AuthorLayout>
      <Outlet />
    </AuthorLayout>
  );
}

export default function App() {
  // Global heartbeat — keeps last_seen fresh for any logged-in reader
  useEffect(() => {
    const ping = () => {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) return;
      fetch("http://localhost:5001/api/readers/ping", {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 60 * 1000); // every 1 minute
    return () => clearInterval(id);
  }, []);

  return (
    <BrowserRouter>
      <CartPanel />
      <Routes>
        {/* Author Panel Routes - NO Navbar/Footer */}
        <Route path="/author/*" element={<AuthorLayoutWrapper />}>
          <Route path="dashboard" element={<AuthorDashboard />} />
          <Route path="books" element={<MyBooks />} />
          <Route path="add-book" element={<AddBook />} />
          <Route path="sales" element={<Sales />} />
          <Route path="reviews"       element={<AuthorReviews />} />
          <Route path="notifications" element={<AuthorNotifications />} />
          <Route path="profile"       element={<AuthorProfile />} />
          {/* Catch unknown /author/* paths — redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>

        {/* Reader page — full screen, no Navbar/Footer */}
        <Route path="/reader/:readToken" element={<Reader />} />

        {/* Admin Panel — separate from reader/author */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"     element={<AdminDashboard />} />
          <Route path="users"         element={<AdminUsers />} />
          <Route path="authors"       element={<AdminAuthors />} />
          <Route path="books"         element={<AdminBooks />} />
          <Route path="payments"      element={<AdminPayments />} />
          <Route path="reviews"       element={<AdminReviews />} />
          <Route path="analytics"     element={<AdminAnalytics />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings"      element={<AdminSettings />} />
          <Route path="*"             element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Reader Routes with Navbar & Footer */}
        <Route path="*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/authors" element={<Authors />} />
              <Route path="/about" element={<About />} />
              <Route path="/book/:bookId" element={<BookDetails />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failure" element={<PaymentFailure />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/my-library" element={<MyLibrary />} />
            </Routes>
            <Footer />
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}
