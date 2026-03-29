const express = require("express");
const {
  createOrder, submitPayment, getOrder, getMyOrders, getLibrary,
  initiateEsewa, verifyEsewa, failOrder,
  adminGetAllOrders, adminGetOrder
} = require("../controllers/orderController");
const authReader = require("../middleware/authReader");

const router = express.Router();

// Reader routes (all require auth)
router.post("/", authReader, createOrder);
router.post("/submit-payment", authReader, submitPayment);
router.post("/initiate-esewa", authReader, initiateEsewa);
router.post("/verify-esewa", authReader, verifyEsewa);
router.post("/fail", authReader, failOrder);
router.get("/my-orders", authReader, getMyOrders);
router.get("/library", authReader, getLibrary);
router.get("/:orderId", authReader, getOrder);

// Admin routes — protected by a simple secret header for now
// TODO: replace with proper admin auth middleware
router.get("/admin/orders", adminGetAllOrders);
router.get("/admin/orders/:orderId", adminGetOrder);

module.exports = router;
