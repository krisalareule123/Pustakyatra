import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";

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

// Author Panel Components
import AuthorLayout from "./components/author/AuthorLayout.jsx";
import AuthorDashboard from "./pages/author/AuthorDashboard.jsx";
import MyBooks from "./pages/author/MyBooks.jsx";
import AddBook from "./pages/author/AddBook.jsx";
import Sales from "./pages/author/Sales.jsx";
import AuthorProfile from "./pages/author/AuthorProfile.jsx";

// Author Layout Wrapper Component
function AuthorLayoutWrapper() {
  return (
    <AuthorLayout>
      <Outlet />
    </AuthorLayout>
  );
}

export default function App() {
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
          <Route path="profile" element={<AuthorProfile />} />
          {/* Catch unknown /author/* paths — redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>

        {/* Reader page — full screen, no Navbar/Footer */}
        <Route path="/reader/:readToken" element={<Reader />} />

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
