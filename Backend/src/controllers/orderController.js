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

    // Step 1: Validate all books are published — reject draft books
    const bookIds = items.map(item => item.bookId).filter(Boolean);
    const placeholders = bookIds.map(() => "?").join(",");

    db.query(
      `SELECT book_id, title, status FROM books WHERE book_id IN (${placeholders})`,
      bookIds,
      (errB, bookRows) => {
        if (errB) {
          return res.status(500).json({ success: false, message: "Failed to validate books" });
        }
        const draftBook = bookRows.find(b => b.status !== "published");
        if (draftBook) {
          return res.status(400).json({
            success: false,
            message: `"${draftBook.title}" is not available for purchase yet.`
          });
        }

        // Step 2: Auto-expire stale pending orders
        db.query(
          `UPDATE orders SET status = 'failed'
           WHERE reader_id = ? AND status = 'pending_payment'
           AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
          [readerId], () => {}
        );

        // Step 3: Create the order
        db.query(
          "INSERT INTO orders (reader_id, total_amount, status) VALUES (?, ?, 'pending_payment')",
          [readerId, totalAmount],
          (err, result) => {
            if (err) {
              console.error("DB error creating order:", err);
              return res.status(500).json({ success: false, message: "Failed to create order" });
            }

            const dbOrderId = result.insertId;

            const itemValues = items.map(item => [
              dbOrderId, item.bookId, item.title, item.type,
              item.quantity, item.price, item.totalPrice,
              item.rentDays || null, null
            ]);

            db.query(
              `INSERT INTO order_items
                (order_id, book_id, book_title, item_type, quantity, price, total_price, rent_days, access_expires_at)
               VALUES ?`,
              [itemValues],
              (err2) => {
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
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Mark order as payment_submitted
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

// Get order details by ID (reader-scoped)
const getOrder = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { orderId } = req.params;

    const orderQuery = `
      SELECT o.order_id, o.total_amount, o.status,
             o.transaction_uuid, o.transaction_code, o.payment_reference,
             o.paid_at, o.created_at,
             oi.item_id, oi.book_id, oi.book_title, oi.item_type,
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
        transactionUuid: results[0].transaction_uuid,
        transactionCode: results[0].transaction_code,
        paymentReference: results[0].payment_reference,
        paidAt: results[0].paid_at,
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

// Get paid orders for logged-in reader (main user-facing endpoint)
// Supports ?status=paid|pending|failed for admin/debug use, defaults to paid only
const getMyOrders = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { status } = req.query;

    // Map filter param to actual DB statuses
    const statusMap = {
      paid:    ["paid"],
      pending: ["pending_payment", "payment_submitted"],
      failed:  ["failed", "cancelled"],
    };

    // Default: only show paid orders to users
    const activeStatuses = statusMap[status] || ["paid"];
    const placeholders = activeStatuses.map(() => "?").join(",");

    const query = `
      SELECT
        o.order_id, o.total_amount, o.status,
        o.transaction_code, o.payment_reference,
        o.paid_at, o.created_at,
        oi.book_id, oi.book_title, oi.item_type,
        oi.quantity, oi.price, oi.total_price,
        oi.rent_days, oi.access_expires_at
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.reader_id = ? AND o.status IN (${placeholders})
      ORDER BY o.created_at DESC
      LIMIT 100
    `;

    db.query(query, [readerId, ...activeStatuses], (err, results) => {
      if (err) {
        console.error("DB error fetching orders:", err.message);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      const ordersMap = {};
      results.forEach(row => {
        if (!ordersMap[row.order_id]) {
          ordersMap[row.order_id] = {
            orderId: row.order_id,
            totalAmount: row.total_amount,
            status: row.status,
            transactionCode: row.transaction_code,
            paymentReference: row.payment_reference,
            paidAt: row.paid_at,
            createdAt: row.created_at,
            items: []
          };
        }
        if (row.book_title) {
          ordersMap[row.order_id].items.push({
            bookId: row.book_id,
            bookTitle: row.book_title,
            itemType: row.item_type,
            quantity: row.quantity,
            price: row.price,
            totalPrice: row.total_price,
            rentDays: row.rent_days,
            accessExpiresAt: row.access_expires_at
          });
        }
      });

      res.status(200).json({
        success: true,
        orders: Object.values(ordersMap)
      });
    });
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Initiate eSewa payment — returns signed form data for frontend to POST
const initiateEsewa = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { orderId, totalAmount, items } = req.body;

    if (!orderId || !totalAmount) {
      return res.status(400).json({ success: false, message: "orderId and totalAmount are required" });
    }

    db.query(
      "SELECT * FROM orders WHERE order_id = ? AND reader_id = ? AND status = 'pending_payment'",
      [orderId, readerId],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(404).json({ success: false, message: "Order not found or already processed" });
        }

        // eSewa v2: transaction_uuid must be alphanumeric/hyphen, no special chars
        const transactionUuid = `PK${orderId}T${Date.now()}`;
        const productCode = process.env.ESEWA_PRODUCT_CODE;

        // eSewa v2: amount fields must be plain numbers (no trailing zeros issues)
        // total_amount = amount + tax + service_charge + delivery_charge
        // With all charges = 0, total_amount must equal amount exactly
        const amount = parseFloat(totalAmount).toFixed(2);
        const taxAmount = "0";
        const serviceCharge = "0";
        const deliveryCharge = "0";
        const totalAmountStr = amount; // must equal amount when all charges are 0

        // Signature: EXACTLY "total_amount,transaction_uuid,product_code" in this order
        const signatureMessage = `total_amount=${totalAmountStr},transaction_uuid=${transactionUuid},product_code=${productCode}`;
        const signature = generateEsewaSignature(signatureMessage);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        const failureParams = new URLSearchParams({
          orderId: String(orderId),
          totalAmount: amount,
          reason: "failed",
          ...(items ? { items: JSON.stringify(items) } : {})
        });

        const paymentData = {
          amount: amount,
          tax_amount: taxAmount,
          product_service_charge: serviceCharge,
          product_delivery_charge: deliveryCharge,
          product_code: productCode,
          total_amount: totalAmountStr,
          transaction_uuid: transactionUuid,
          success_url: `${frontendUrl}/payment/success`,
          failure_url: `${frontendUrl}/payment/failure?${failureParams.toString()}`,
          signed_field_names: "total_amount,transaction_uuid,product_code",
          signature: signature,
        };

        // Debug log — verify payload before sending to frontend
        console.log("=== eSewa Payload Debug ===");
        console.log("Product Code    :", productCode);
        console.log("Amount          :", amount);
        console.log("Total Amount    :", totalAmountStr);
        console.log("Transaction UUID:", transactionUuid);
        console.log("Signature Msg   :", signatureMessage);
        console.log("Signature       :", signature);
        console.log("Payment URL     :", process.env.ESEWA_PAYMENT_URL);
        console.log("Success URL     :", paymentData.success_url);
        console.log("Failure URL     :", paymentData.failure_url);
        console.log("Full Payload    :", JSON.stringify(paymentData, null, 2));
        console.log("==========================");

        // Validate all required fields are present and non-empty
        const requiredFields = ["amount","tax_amount","product_service_charge","product_delivery_charge","total_amount","transaction_uuid","product_code","success_url","failure_url","signed_field_names","signature"];
        const missing = requiredFields.filter(f => !paymentData[f] && paymentData[f] !== "0");
        if (missing.length > 0) {
          console.error("eSewa payload missing fields:", missing);
          return res.status(500).json({ success: false, message: "Payment config error: missing fields: " + missing.join(", ") });
        }

        res.status(200).json({
          success: true,
          paymentData,
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
      return res.status(400).json({ success: false, message: "No payment data received from eSewa" });
    }

    // Step 1: Decode Base64 response
    let decoded;
    try {
      decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
    } catch (e) {
      console.error("Failed to decode eSewa response:", e.message);
      return res.status(400).json({ success: false, message: "Invalid payment response encoding" });
    }

    console.log("eSewa decoded response:", JSON.stringify(decoded));

    const { status, transaction_uuid, transaction_code, signed_field_names, signature } = decoded;

    // Step 2: Verify HMAC signature
    if (!signed_field_names || !signature) {
      return res.status(400).json({ success: false, message: "Missing signature fields in eSewa response" });
    }

    const signatureMessage = signed_field_names.split(",").map(f => `${f}=${decoded[f]}`).join(",");
    const expectedSignature = generateEsewaSignature(signatureMessage);

    console.log("Signature match:", signature === expectedSignature);

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Payment verification failed: signature mismatch" });
    }

    if (status !== "COMPLETE") {
      return res.status(400).json({ success: false, message: `Payment not completed. eSewa status: ${status}` });
    }

    // Step 3: Extract orderId from transaction_uuid (format: PK{orderId}T{timestamp})
    const uuidMatch = transaction_uuid ? transaction_uuid.match(/^PK(\d+)T\d+$/) : null;
    const orderId = uuidMatch ? uuidMatch[1] : null;

    if (!orderId) {
      console.error("Could not extract orderId from transaction_uuid:", transaction_uuid);
      return res.status(400).json({ success: false, message: "Could not identify order from payment response" });
    }

    // Step 4: Check if order is already paid (idempotency guard — handles double verify calls)
    db.query(
      "SELECT order_id, status, transaction_code FROM orders WHERE order_id = ? AND reader_id = ?",
      [orderId, readerId],
      (err, rows) => {
        if (err) {
          console.error("DB error checking order:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        if (!rows || rows.length === 0) {
          return res.status(404).json({ success: false, message: "Order not found" });
        }

        const order = rows[0];

        // Already paid — return success immediately without re-updating
        if (order.status === "paid") {
          console.log("Order already paid, returning cached success for order:", orderId);
          return fetchAndReturnOrder(orderId, transaction_code, res);
        }

        // Step 5: Update order to paid
        const paymentReference = `eSewa/${transaction_code || transaction_uuid}/${new Date().toISOString().slice(0, 10)}`;

        db.query(
          `UPDATE orders
           SET status = 'paid',
               transaction_uuid = ?,
               transaction_code = ?,
               payment_reference = ?,
               paid_at = NOW()
           WHERE order_id = ? AND reader_id = ?`,
          [transaction_uuid, transaction_code || null, paymentReference, orderId, readerId],
          (err2, result) => {
            if (err2) {
              console.error("DB error updating order to paid:", err2.message);
              return res.status(500).json({ success: false, message: "Failed to update order in database" });
            }

            if (result.affectedRows === 0) {
              console.error("Update affected 0 rows for order:", orderId);
              return res.status(500).json({ success: false, message: "Failed to update order — no rows affected" });
            }

            console.log("Order marked as paid:", orderId);

            // Step 6: Grant book access (non-blocking)
            db.query(
              `UPDATE order_items
               SET access_expires_at = CASE
                 WHEN item_type = 'rent' AND rent_days = 0 THEN DATE_ADD(NOW(), INTERVAL 5 MINUTE)
                 WHEN item_type = 'rent' THEN DATE_ADD(NOW(), INTERVAL rent_days DAY)
                 ELSE NULL
               END
               WHERE order_id = ?`,
              [orderId],
              (err3) => { if (err3) console.error("Error granting book access:", err3.message); }
            );

            // Step 7: Notify authors + admin for each purchased/rented book (non-blocking)
            const { createAuthorNotification } = require("./bookController");
            const { createAdminNotification }  = require("./adminController");
            // Fetch reader name once
            db.query("SELECT full_name FROM readers WHERE reader_id = ?", [readerId], (errR, readerRows) => {
              const readerName = (!errR && readerRows?.[0]?.full_name) ? readerRows[0].full_name : "A reader";

              db.query(
                `SELECT oi.book_id, oi.item_type, oi.book_title, b.author_id
                 FROM order_items oi
                 LEFT JOIN books b ON b.book_id = oi.book_id
                 WHERE oi.order_id = ?`,
                [orderId],
                (err4, items) => {
                  if (!err4 && items) {
                    items.forEach(item => {
                      if (!item.author_id) return;
                      const type = item.item_type === "rent" ? "rent" : "purchase";
                      const msg  = item.item_type === "rent"
                        ? `${readerName} rented your book "${item.book_title}"`
                        : `${readerName} purchased your book "${item.book_title}"`;
                      createAuthorNotification(item.author_id, item.book_id, type, msg, readerId);

                      // Also notify admin
                      const adminMsg = item.item_type === "rent"
                        ? `${readerName} rented "${item.book_title}"`
                        : `${readerName} purchased "${item.book_title}"`;
                      createAdminNotification(type, adminMsg, item.book_id);
                    });
                  }
                }
              );
            });

            fetchAndReturnOrder(orderId, transaction_code, res);
          }
        );
      }
    );
  } catch (error) {
    console.error("verifyEsewa unexpected error:", error);
    res.status(500).json({ success: false, message: "Server error during payment verification" });
  }
};

// Helper: fetch order details and send success response
const fetchAndReturnOrder = (orderId, transaction_code, res) => {
  db.query(
    `SELECT o.order_id, o.total_amount, o.transaction_code, o.transaction_uuid,
            o.payment_reference, o.paid_at,
            oi.book_id, oi.book_title, oi.item_type, oi.rent_days, oi.access_expires_at
     FROM orders o
     LEFT JOIN order_items oi ON o.order_id = oi.order_id
     WHERE o.order_id = ?`,
    [orderId],
    (err, rows) => {
      if (err) console.error("Error fetching order after payment:", err.message);

      const items = rows
        ? rows.filter(r => r.book_title).map(r => ({
            bookId: r.book_id,
            bookTitle: r.book_title,
            itemType: r.item_type,
            rentDays: r.rent_days,
            accessExpiresAt: r.access_expires_at
          }))
        : [];

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        orderId: parseInt(orderId),
        totalAmount: rows?.[0]?.total_amount,
        transactionCode: transaction_code || rows?.[0]?.transaction_code,
        paymentReference: rows?.[0]?.payment_reference,
        paidAt: rows?.[0]?.paid_at,
        status: "paid",
        items
      });
    }
  );
};

// Get reader's library — paid books with access info
const getLibrary = (req, res) => {
  try {
    const readerId = req.user.reader_id;

    const query = `
      SELECT
        oi.book_id,
        oi.book_title,
        oi.item_type AS access_type,
        oi.rent_days,
        oi.access_expires_at,
        o.order_id,
        o.paid_at,
        CASE
          WHEN oi.item_type = 'rent' AND oi.access_expires_at IS NOT NULL
            THEN GREATEST(0, DATEDIFF(oi.access_expires_at, NOW()))
          ELSE NULL
        END AS remaining_days
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.reader_id = ? AND o.status = 'paid'
        AND (
          oi.item_type = 'buy'
          OR (oi.item_type = 'rent' AND oi.access_expires_at > NOW())
        )
      ORDER BY o.paid_at DESC
    `;

    db.query(query, [readerId], (err, results) => {
      if (err) {
        console.error("DB error fetching library:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      const library = results.map(r => ({
        bookId: r.book_id,
        bookTitle: r.book_title,
        accessType: r.access_type,
        rentDays: r.rent_days,
        rentExpiresAt: r.access_expires_at,
        remainingDays: r.remaining_days,
        orderId: r.order_id,
        paidAt: r.paid_at
      }));

      res.status(200).json({ success: true, library });
    });
  } catch (error) {
    console.error("getLibrary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Issue a short-lived read token for a book the reader has access to
// Returns a signed JWT token used in the reader URL — hides raw book_id
const issueReadToken = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId } = req.params;

    // Verify access first
    const query = `
      SELECT oi.book_id, oi.book_title, oi.item_type, oi.access_expires_at
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.reader_id = ? AND oi.book_id = ? AND o.status = 'paid'
        AND (oi.item_type = 'buy' OR (oi.item_type = 'rent' AND oi.access_expires_at > NOW()))
      LIMIT 1
    `;

    db.query(query, [readerId, bookId], (err, results) => {
      if (err) {
        console.error("DB error issuing read token:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (!results || results.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Purchase or rent this book to read it."
        });
      }

      const row = results[0];
      const jwt = require("jsonwebtoken");

      // Sign a token: expires in 4 hours, encodes reader + book
      const token = jwt.sign(
        { readerId, bookId: row.book_id, type: "read" },
        process.env.JWT_SECRET,
        { expiresIn: "4h" }
      );

      // Encode as URL-safe base64 with a prefix so it looks clean
      const publicToken = "read_" + Buffer.from(token).toString("base64url");

      res.status(200).json({ success: true, readToken: publicToken });
    });
  } catch (error) {
    console.error("issueReadToken error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Resolve a read token — verify it and return book access info + pdf url
// This is called by the Reader page on load
const resolveReadToken = (req, res) => {
  try {
    const { token } = req.params;

    if (!token || !token.startsWith("read_")) {
      return res.status(400).json({ success: false, message: "Invalid read token" });
    }

    const jwt = require("jsonwebtoken");
    let payload;

    try {
      const rawToken = Buffer.from(token.slice(5), "base64url").toString("utf-8");
      payload = jwt.verify(rawToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: "Read token expired or invalid. Please go back to My Library." });
    }

    if (payload.type !== "read") {
      return res.status(401).json({ success: false, message: "Invalid token type" });
    }

    const { readerId, bookId } = payload;

    // Re-verify DB access AND join books table for pdf_file
    const query = `
      SELECT
        oi.book_id, oi.book_title, oi.item_type,
        oi.rent_days, oi.access_expires_at,
        o.order_id, o.paid_at,
        b.pdf_file, b.title AS db_title,
        a.full_name AS author_name
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN books b ON b.book_id = oi.book_id
      LEFT JOIN authors a ON a.author_id = b.author_id
      WHERE o.reader_id = ? AND oi.book_id = ? AND o.status = 'paid'
        AND (oi.item_type = 'buy' OR (oi.item_type = 'rent' AND oi.access_expires_at > NOW()))
      ORDER BY o.paid_at DESC
      LIMIT 1
    `;

    db.query(query, [readerId, bookId], (err, results) => {
      if (err) {
        console.error("DB error resolving read token:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (!results || results.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied or rental has expired."
        });
      }

      const row = results[0];
      const isRent = row.item_type === "rent";
      const remainingDays = isRent && row.access_expires_at
        ? Math.ceil((new Date(row.access_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      const canDownload = row.item_type === "buy";
      // pdfAvailable = book has a real uploaded PDF in the books table
      const pdfAvailable = !!row.pdf_file;
      // Protected read URL — frontend will call this to stream the PDF
      const pdfReadUrl = pdfAvailable
        ? `${process.env.BACKEND_URL || "http://localhost:5001"}/api/books/${row.book_id}/read`
        : null;
      const pdfDownloadUrl = (canDownload && pdfAvailable)
        ? `${process.env.BACKEND_URL || "http://localhost:5001"}/api/books/${row.book_id}/download`
        : null;

      res.status(200).json({
        success: true,
        bookId: row.book_id,
        bookTitle: row.db_title || row.book_title,
        authorName: row.author_name || null,
        accessType: row.item_type,
        rentExpiresAt: row.access_expires_at,
        remainingDays,
        canDownload,
        pdfAvailable,
        pdfReadUrl,
        pdfDownloadUrl,
        orderId: row.order_id,
        paidAt: row.paid_at
      });
    });
  } catch (error) {
    console.error("resolveReadToken error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Verify reader has access to a specific book (for reader page)
const checkBookAccess = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { bookId } = req.params;

    const query = `
      SELECT
        oi.book_id, oi.book_title, oi.item_type,
        oi.rent_days, oi.access_expires_at,
        o.order_id, o.paid_at
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.reader_id = ?
        AND oi.book_id = ?
        AND o.status = 'paid'
        AND (
          oi.item_type = 'buy'
          OR (oi.item_type = 'rent' AND oi.access_expires_at > NOW())
        )
      ORDER BY o.paid_at DESC
      LIMIT 1
    `;

    db.query(query, [readerId, bookId], (err, results) => {
      if (err) {
        console.error("DB error checking book access:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (!results || results.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Please purchase or rent this book to read it."
        });
      }

      const row = results[0];
      const isRent = row.item_type === "rent";
      const remainingDays = isRent && row.access_expires_at
        ? Math.ceil((new Date(row.access_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      res.status(200).json({
        success: true,
        access: {
          bookId: row.book_id,
          bookTitle: row.book_title,
          accessType: row.item_type,
          rentExpiresAt: row.access_expires_at,
          remainingDays,
          orderId: row.order_id,
          paidAt: row.paid_at
        }
      });
    });
  } catch (error) {
    console.error("checkBookAccess error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update order to failed/cancelled
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

// Admin: get all orders with reader info (no reader_id filter)
const adminGetAllOrders = (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = "";
    const params = [];

    if (status) {
      whereClause = "WHERE o.status = ?";
      params.push(status);
    }

    const query = `
      SELECT
        o.order_id, o.total_amount, o.status,
        o.transaction_uuid, o.transaction_code, o.payment_reference,
        o.paid_at, o.created_at,
        r.reader_id, r.name AS reader_name, r.email AS reader_email,
        COUNT(oi.item_id) AS item_count
      FROM orders o
      JOIN readers r ON o.reader_id = r.reader_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Admin orders fetch error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT o.order_id) AS total FROM orders o ${whereClause}`;
      db.query(countQuery, status ? [status] : [], (err2, countResult) => {
        const total = countResult?.[0]?.total || 0;
        res.status(200).json({
          success: true,
          orders: results,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        });
      });
    });
  } catch (error) {
    console.error("Admin get orders error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Admin: get single order with full details
const adminGetOrder = (req, res) => {
  try {
    const { orderId } = req.params;

    const query = `
      SELECT o.order_id, o.total_amount, o.status,
             o.transaction_uuid, o.transaction_code, o.payment_reference,
             o.paid_at, o.created_at,
             r.reader_id, r.name AS reader_name, r.email AS reader_email,
             oi.item_id, oi.book_id, oi.book_title, oi.item_type,
             oi.quantity, oi.price, oi.total_price, oi.rent_days, oi.access_expires_at
      FROM orders o
      JOIN readers r ON o.reader_id = r.reader_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = ?
    `;

    db.query(query, [orderId], (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const order = {
        orderId: results[0].order_id,
        totalAmount: results[0].total_amount,
        status: results[0].status,
        transactionUuid: results[0].transaction_uuid,
        transactionCode: results[0].transaction_code,
        paymentReference: results[0].payment_reference,
        paidAt: results[0].paid_at,
        createdAt: results[0].created_at,
        reader: {
          readerId: results[0].reader_id,
          name: results[0].reader_name,
          email: results[0].reader_email
        },
        items: results.filter(r => r.item_id).map(r => ({
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
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// DEV ONLY: Simulate a successful payment without going through eSewa
// Useful when eSewa sandbox is down (502/503 errors)
const simulatePayment = (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const fakeTransactionCode = "SIM" + Date.now();
    const paymentReference = `Simulated/${fakeTransactionCode}/${new Date().toISOString().slice(0, 10)}`;

    db.query(
      `UPDATE orders
       SET status = 'paid',
           transaction_uuid = ?,
           transaction_code = ?,
           payment_reference = ?,
           paid_at = NOW()
       WHERE order_id = ? AND reader_id = ? AND status = 'pending_payment'`,
      [`SIM${orderId}T${Date.now()}`, fakeTransactionCode, paymentReference, orderId, readerId],
      (err, result) => {
        if (err) {
          console.error("Simulate payment DB error:", err.message);
          return res.status(500).json({ success: false, message: "DB error" });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: "Order not found or already processed" });
        }

        // Grant book access
        db.query(
          `UPDATE order_items
           SET access_expires_at = CASE
             WHEN item_type = 'rent' THEN DATE_ADD(NOW(), INTERVAL rent_days DAY)
             ELSE NULL
           END
           WHERE order_id = ?`,
          [orderId], () => {}
        );

        return fetchAndReturnOrder(orderId, fakeTransactionCode, res);
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrder,
  submitPayment,
  getOrder,
  getMyOrders,
  getLibrary,
  checkBookAccess,
  issueReadToken,
  resolveReadToken,
  initiateEsewa,
  verifyEsewa,
  failOrder,
  simulatePayment,
  adminGetAllOrders,
  adminGetOrder
};
