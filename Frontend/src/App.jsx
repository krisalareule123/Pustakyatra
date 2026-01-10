import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";

import Browse from "./pages/Browse";
import Categories from "./pages/Categories";
import Authors from "./pages/Authors";
import About from "./pages/About";

import UserDashboard from "./pages/UserDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/browse" element={<Browse />} />
<Route path="/categories" element={<Categories />} />
<Route path="/authors" element={<Authors />} />
<Route path="/about" element={<About />} />

<Route path="/dashboard" element={<UserDashboard />} />

      </Routes>

      <Footer />
    </BrowserRouter>
  );
}
