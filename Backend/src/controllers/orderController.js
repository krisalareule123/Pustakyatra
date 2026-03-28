const db = require("../config/db");
const crypto = require("crypto");

// Generate HMAC-SHA256 signature for eSewa
const generateEsewaSignature = (message) => {
  const secret = process.env.ESEWA_SECRET_KEY;
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
};

// Generate a readable order ID like PK-20250001
const generateOrderId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PK-${year}${rand}`;
};

// Create order (called when user clicks Place Order / Pay Now)
const createOrder = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { items, totalAmount } = req.body;

    if (!items || items.length === 0 || !totalAmount) {
      return res.status(400).json({ success: false, message: "Please provide order items and total amount" });
    }

    const orderId = generateOrderId();

    const insertOrder = `
      INSERT INTO orders (reader_id, total_amount, status)
      VALUES (?, ?, 'pending_payment')
    `;

    db.query(insertOrder, [readerId, totalAmount], (err, result) => {
      if (err) {
        console.error("DB error creating order:", err);
        return res.status(500).json({ success: false, message: "Failed to create order" });
      }

      const dbOrderId = result.insertId;

      // Insert all order items
      const itemValues = items.map(item => [
        dbOrderId,
        item.bookId,
        item.title,
        item.type,
        item.quantity,
        item.price,
        item.totalPrice,
        item.rentDays || null,
        null // access_expires_at — set after payment confirmed
      ]);

      const insertItems = `
        INSERT INTO order_items
          (order_id, book_id, book_title, item_type, quantity, price, total_price, rent_days, access_expires_at)
        VALUES ?
      `;

      db.query(insertItems, [itemValues], (err2) => {
        if (err2) {
          console.error("DB error inserting order items:", err2);
          return res.status(500).json({ success: false, message: "Failed to save order items" });
        }

        res.status(201).json({
          success: true,
          message: "Order created successfully",
          order: {
            orderId: dbOrderId,
            displayOrderId: orderId,
            totalAmount,
            status: "pending_payment"
          }
        });
      });
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Mark order as payment_submitted (user clicked "I Have Paid")
const submitPayment = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Please provide order ID" });
    }

    const query = `
      UPDATE orders SET status = 'payment_submitted'
      WHERE order_id = ? AND reader_id = ? AND status = 'pending_payment'
    `;

    db.query(query, [orderId, readerId], (err, result) => {
      if (err) {
        console.error("DB error submitting payment:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Order not found or already processed" });
      }

      res.status(200).json({
        success: true,
        message: "Payment submitted. Your order is being verified.",
        status: "payment_submitted"
      });
    });
  } catch (error) {
    console.error("Submit payment error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Get order details by ID
const getOrder = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { orderId } = req.params;

    const orderQuery = `
      SELECT o.*, oi.item_id, oi.book_id, oi.book_title, oi.item_type,
             oi.quantity, oi.price, oi.total_price, oi.rent_days, oi.access_expires_at
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = ? AND o.reader_id = ?
    `;

    db.query(orderQuery, [orderId, readerId], (err, results) => {
      if (err) {
        console.error("DB error fetching order:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const order = {
        orderId: results[0].order_id,
        totalAmount: results[0].total_amount,
        status: results[0].status,
        createdAt: results[0].created_at,
        items: results.map(r => ({
          itemId: r.item_id,
          bookId: r.book_id,
          bookTitle: r.book_title,
          itemType: r.item_type,
          quantity: r.quantity,
          price: r.price,
          totalPrice: r.total_price,
          rentDays: r.rent_days,
          accessExpiresAt: r.access_expires_at
        }))
      };

      res.status(200).json({ success: true, order });
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Get all orders for logged-in reader
const getMyOrders = (req, res) => {
  try {
    const readerId = req.user.reader_id;

    const query = `
      SELECT o.order_id, o.total_amount, o.status, o.created_at,
             COUNT(oi.item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.reader_id = ?
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `;

    db.query(query, [readerId], (err, results) => {
      if (err) {
        console.error("DB error fetching orders:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      res.status(200).json({ success: true, orders: results });
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

module.exports = { createOrder, submitPayment, getOrder, getMyOrders };

// Initiate eSewa payment — returns signed form data for frontend to POST
const initiateEsewa = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { orderId, totalAmount, items } = req.body;

    if (!orderId || !totalAmount) {
      return res.status(400).json({ success: false, message: "orderId and totalAmount are required" });
    }

    // Verify order belongs to this reader
    db.query(
      "SELECT * FROM orders WHERE order_id = ? AND reader_id = ? AND status = 'pending_payment'",
      [orderId, readerId],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(404).json({ success: false, message: "Order not found or already processed" });
        }

        const transactionUuid = `PK-${orderId}-${Date.now()}`;
        const productCode = process.env.ESEWA_PRODUCT_CODE;
        const amount = parseFloat(totalAmount).toFixed(2);

        // Signature message: total_amount,transaction_uuid,product_code
        const message = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
        const signature = generateEsewaSignature(message);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        // Build failure URL with enough info to retry without creating a new order
        const failureParams = new URLSearchParams({
          orderId: String(orderId),
          totalAmount: amount,
          reason: "failed",
          ...(items ? { items: JSON.stringify(items) } : {})
        });

        res.status(200).json({
          success: true,
          paymentData: {
            amount: amount,
            tax_amount: "0",
            product_service_charge: "0",
            product_delivery_charge: "0",
            product_code: productCode,
            total_amount: amount,
            transaction_uuid: transactionUuid,
            success_url: `${frontendUrl}/payment/success`,
            failure_url: `${frontendUrl}/payment/failure?${failureParams.toString()}`,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature: signature,
          },
          paymentUrl: process.env.ESEWA_PAYMENT_URL,
        });
      }
    );
  } catch (error) {
    console.error("Initiate eSewa error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Verify eSewa payment after redirect back
const verifyEsewa = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { encodedData } = req.body;

    if (!encodedData) {
      return res.status(400).json({ success: false, message: "No payment data received" });
    }

    // Decode Base64 response from eSewa
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
    } catch {
      return res.status(400).json({ success: false, message: "Invalid payment response" });
    }

    const { status, transaction_uuid, total_amount, signed_field_names, signature } = decoded;

    // Verify signature
    const fields = signed_field_names.split(",");
    const message = fields.map(f => `${f}=${decoded[f]}`).join(",");
    const expectedSignature = generateEsewaSignature(message);

    if (signature !== expectedSignature) {
      console.error("eSewa signature mismatch");
      return res.status(400).json({ success: false, message: "Payment verification failed: invalid signature" });
    }

    if (status !== "COMPLETE") {
      return res.status(400).json({ success: false, message: `Payment not completed. Status: ${status}` });
    }

    // Extract orderId from transaction_uuid (format: PK-{orderId}-{timestamp})
    const parts = transaction_uuid.split("-");
    const orderId = parts[1];

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Could not extract order ID from transaction" });
    }

    // Update order status to paid
    db.query(
      "UPDATE orders SET status = 'paid' WHERE order_id = ? AND reader_id = ?",
      [orderId, readerId],
      (err, result) => {
        if (err || result.affectedRows === 0) {
          return res.status(500).json({ success: false, message: "Failed to update order status" });
        }

        // Grant access: update access_expires_at for rent items
        db.query(
          `UPDATE order_items
           SET access_expires_at = CASE
             WHEN item_type = 'rent' THEN DATE_ADD(NOW(), INTERVAL rent_days DAY)
             ELSE NULL
           END
           WHERE order_id = ?`,
          [orderId],
          () => {} // non-blocking
        );

        res.status(200).json({
          success: true,
          message: "Payment verified successfully!",
          orderId,
          status: "paid"
        });
      }
    );
  } catch (error) {
    console.error("Verify eSewa error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Update order to failed/cancelled (called from failure URL)
const failOrder = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { orderId, reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const status = reason === "cancelled" ? "cancelled" : "failed";

    db.query(
      "UPDATE orders SET status = ? WHERE order_id = ? AND reader_id = ? AND status = 'pending_payment'",
      [status, orderId, readerId],
      (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Server error" });
        }
        res.status(200).json({ success: true, message: `Order marked as ${status}` });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

module.exports = { createOrder, submitPayment, getOrder, getMyOrders, initiateEsewa, verifyEsewa, failOrder };
