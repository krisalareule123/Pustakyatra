const express = require("express");
const { createOrder, submitPayment, getOrder, getMyOrders, initiateEsewa, verifyEsewa, failOrder } = require("../controllers/orderController");
const authReader = require("../middleware/authReader");

const router = express.Router();

// All order routes require authentication
router.post("/", authReader, createOrder);
router.post("/submit-payment", authReader, submitPayment);
router.post("/initiate-esewa", authReader, initiateEsewa);
router.post("/verify-esewa", authReader, verifyEsewa);
router.post("/fail", authReader, failOrder);
router.get("/my-orders", authReader, getMyOrders);
router.get("/:orderId", authReader, getOrder);

module.exports = router;
