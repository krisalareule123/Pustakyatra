const express = require("express");
const {
  createOrder, submitPayment, getOrder, getMyOrders, getLibrary,
  checkBookAccess, issueReadToken, resolveReadToken,
  initiateEsewa, verifyEsewa, failOrder, simulatePayment,
  adminGetAllOrders, adminGetOrder,
  createStripeSession
} = require("../controllers/orderController");
const authReader = require("../middleware/authReader");

const router = express.Router();

// Reader routes (all require auth)
router.post("/", authReader, createOrder);
router.post("/submit-payment", authReader, submitPayment);
router.post("/initiate-esewa", authReader, initiateEsewa);
router.post("/verify-esewa", authReader, verifyEsewa);
router.post("/stripe/create-session", authReader, createStripeSession);
router.post("/fail", authReader, failOrder);
router.post("/simulate-payment", authReader, simulatePayment); // DEV: bypass eSewa when sandbox is down
router.get("/my-orders", authReader, getMyOrders);
router.get("/library", authReader, getLibrary);
router.get("/access/:bookId", authReader, checkBookAccess);
// Issue a read token (hides raw book ID from URL)
router.post("/read-token/:bookId", authReader, issueReadToken);
// Resolve a read token (called by Reader page — no auth header needed, token is self-contained)
router.get("/resolve/:token", resolveReadToken);
router.get("/:orderId", authReader, getOrder);

// Admin routes — protected by a simple secret header for now
// TODO: replace with proper admin auth middleware
router.get("/admin/orders", adminGetAllOrders);
router.get("/admin/orders/:orderId", adminGetOrder);

module.exports = router;
