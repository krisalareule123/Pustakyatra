const db = require("../config/db");

function q(sql, params = []) {
  return new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));
}

// ── Author: Create Promo Code ─────────────────────────────────────────────────
const createPromoCode = async (req, res) => {
  try {
    const authorId = req.user.author_id;
    const {
      code, discount_type, discount_value, promo_scope,
      book_id, occasion, expiry_date, usage_limit,
      per_reader_limit, minimum_order_amount
    } = req.body;

    // Required field check
    if (!code || !discount_type || !discount_value || !promo_scope || !occasion || !expiry_date) {
      return res.status(400).json({ success: false, message: "All required fields must be provided." });
    }

    // Discount value validation
    if (discount_type === "percentage") {
      if (discount_value < 1 || discount_value > 100) {
        return res.status(400).json({ success: false, message: "Percentage discount must be between 1 and 100." });
      }
    } else if (discount_type === "flat") {
      if (discount_value < 1) {
        return res.status(400).json({ success: false, message: "Flat discount must be at least Rs 1." });
      }
    }

    // Expiry date must be in the future
    if (new Date(expiry_date) <= new Date()) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be in the past." });
    }

    // If specific_book scope, verify book belongs to author
    if (promo_scope === "specific_book") {
      if (!book_id) {
        return res.status(400).json({ success: false, message: "A book must be selected for specific_book scope." });
      }
      const books = await q("SELECT book_id FROM books WHERE book_id = ? AND author_id = ?", [book_id, authorId]);
      if (books.length === 0) {
        return res.status(403).json({ success: false, message: "The selected book does not belong to your account." });
      }
    }

    // Check code uniqueness (case-insensitive)
    const existing = await q("SELECT promo_code_id FROM promo_codes WHERE UPPER(code) = UPPER(?)", [code]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "A promo code with this name already exists." });
    }

    // Insert promo code
    const result = await q(
      `INSERT INTO promo_codes
        (author_id, code, discount_type, discount_value, promo_scope, book_id, occasion,
         expiry_date, usage_limit, per_reader_limit, minimum_order_amount, status)
       VALUES (?, UPPER(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        authorId, code, discount_type, discount_value, promo_scope,
        promo_scope === "specific_book" ? book_id : null,
        occasion, expiry_date,
        usage_limit || 100,
        per_reader_limit || 1,
        minimum_order_amount || 0
      ]
    );

    // Notify admin
    const authorRows = await q("SELECT full_name FROM authors WHERE author_id = ?", [authorId]);
    const authorName = authorRows[0]?.full_name || "An author";
    await q(
      "INSERT INTO admin_notifications (type, message, related_id) VALUES (?, ?, ?)",
      ["promo_pending", `${authorName} created a new promo code "${code.toUpperCase()}" — awaiting approval.`, result.insertId]
    ).catch(() => {}); // non-blocking

    res.status(201).json({ success: true, message: "Promo code created and pending admin approval.", promoCodeId: result.insertId });
  } catch (err) {
    console.error("createPromoCode error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Author: Get My Promo Codes ────────────────────────────────────────────────
const getAuthorPromoCodes = async (req, res) => {
  try {
    const authorId = req.user.author_id;
    const rows = await q(
      `SELECT pc.*, b.title AS book_title
       FROM promo_codes pc
       LEFT JOIN books b ON b.book_id = pc.book_id
       WHERE pc.author_id = ?
       ORDER BY pc.created_at DESC`,
      [authorId]
    );
    res.json({ success: true, promoCodes: rows });
  } catch (err) {
    console.error("getAuthorPromoCodes error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Author: Delete Promo Code ─────────────────────────────────────────────────
const deletePromoCode = async (req, res) => {
  try {
    const authorId = req.user.author_id;
    const { id } = req.params;

    const rows = await q("SELECT * FROM promo_codes WHERE promo_code_id = ? AND author_id = ?", [id, authorId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Promo code not found." });
    }

    if (rows[0].status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending promo codes can be deleted. Contact admin to disable active codes." });
    }

    await q("DELETE FROM promo_codes WHERE promo_code_id = ?", [id]);
    res.json({ success: true, message: "Promo code deleted." });
  } catch (err) {
    console.error("deletePromoCode error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Reader: Validate Promo Code ───────────────────────────────────────────────
const validatePromoCode = async (req, res) => {
  try {
    const readerId = req.user.reader_id;
    const { code, items, cartTotal } = req.body;

    if (!code || !items || !cartTotal) {
      return res.status(400).json({ success: false, message: "code, items, and cartTotal are required." });
    }

    // Find code (case-insensitive)
    const rows = await q(
      `SELECT pc.*, a.author_id AS promo_author_id
       FROM promo_codes pc
       JOIN authors a ON a.author_id = pc.author_id
       WHERE UPPER(pc.code) = UPPER(?)`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Invalid promo code." });
    }

    const promo = rows[0];

    // Status checks
    if (promo.status === "pending") {
      return res.status(400).json({ success: false, message: "This promo code is not yet active." });
    }

    // Auto-disable if expired
    if (new Date(promo.expiry_date) < new Date()) {
      await q("UPDATE promo_codes SET status = 'disabled' WHERE promo_code_id = ?", [promo.promo_code_id]).catch(() => {});
      return res.status(400).json({ success: false, message: "This promo code has expired." });
    }

    if (promo.status === "disabled") {
      return res.status(400).json({ success: false, message: "This promo code is no longer valid." });
    }

    // Usage limit
    if (promo.usage_count >= promo.usage_limit) {
      return res.status(400).json({ success: false, message: "This promo code has reached its usage limit." });
    }

    // Per-reader limit
    const usageRows = await q(
      "SELECT COUNT(*) AS cnt FROM promo_code_usages WHERE promo_code_id = ? AND reader_id = ?",
      [promo.promo_code_id, readerId]
    );
    if (usageRows[0].cnt >= promo.per_reader_limit) {
      return res.status(400).json({ success: false, message: "You have already used this promo code the maximum number of times." });
    }

    // Minimum order amount
    if (parseFloat(cartTotal) < parseFloat(promo.minimum_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of Rs ${promo.minimum_order_amount} is required for this promo code.`
      });
    }

    // Scope validation — determine applicable items
    let applicableItems = [];

    if (promo.promo_scope === "specific_book") {
      applicableItems = items.filter(i => String(i.bookId) === String(promo.book_id));
      if (applicableItems.length === 0) {
        return res.status(400).json({ success: false, message: "This promo code is not valid for the items in your cart." });
      }
    } else if (promo.promo_scope === "rent_only") {
      applicableItems = items.filter(i => i.type === "rent");
      if (applicableItems.length === 0) {
        return res.status(400).json({ success: false, message: "This promo code is only valid for rental orders." });
      }
    } else {
      // all_books — must have at least one item from this author
      // items from frontend have authorId field
      applicableItems = items.filter(i => String(i.authorId) === String(promo.promo_author_id));
      if (applicableItems.length === 0) {
        return res.status(400).json({ success: false, message: "This promo code is not valid for the items in your cart." });
      }
    }

    // Occasion-specific eligibility
    if (promo.occasion === "loyalty") {
      const loyalRows = await q(
        `SELECT COUNT(*) AS cnt FROM orders o
         JOIN order_items oi ON oi.order_id = o.order_id
         JOIN books b ON b.book_id = oi.book_id
         WHERE o.reader_id = ? AND o.status = 'paid' AND b.author_id = ?`,
        [readerId, promo.promo_author_id]
      );
      if (loyalRows[0].cnt === 0) {
        return res.status(400).json({ success: false, message: "This promo code is for loyal readers who have previously purchased from this author." });
      }
    }

    if (promo.occasion === "first_reader") {
      const priorRows = await q(
        "SELECT COUNT(*) AS cnt FROM orders WHERE reader_id = ? AND status = 'paid'",
        [readerId]
      );
      if (priorRows[0].cnt > 0) {
        return res.status(400).json({ success: false, message: "This promo code is only valid for first-time purchases." });
      }
    }

    // Calculate discount
    const applicableSubtotal = applicableItems.reduce((sum, i) => sum + parseFloat(i.totalPrice || i.price || 0), 0);
    let discountAmount;

    if (promo.discount_type === "percentage") {
      discountAmount = Math.round((promo.discount_value / 100) * applicableSubtotal * 100) / 100;
    } else {
      discountAmount = Math.min(parseFloat(promo.discount_value), applicableSubtotal);
    }

    const discountedTotal = Math.max(1, parseFloat(cartTotal) - discountAmount);

    res.json({
      success: true,
      discount_amount: Math.round(discountAmount * 100) / 100,
      discounted_total: Math.round(discountedTotal * 100) / 100,
      promo_code_id: promo.promo_code_id,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value
    });
  } catch (err) {
    console.error("validatePromoCode error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Author: Edit Promo Code (pending only) ────────────────────────────────────
const updatePromoCode = async (req, res) => {
  try {
    const authorId = req.user.author_id;
    const { id } = req.params;
    const {
      discount_type, discount_value, promo_scope,
      book_id, occasion, expiry_date, usage_limit,
      per_reader_limit, minimum_order_amount
    } = req.body;

    const rows = await q("SELECT * FROM promo_codes WHERE promo_code_id = ? AND author_id = ?", [id, authorId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Promo code not found." });
    if (rows[0].status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending promo codes can be edited." });
    }

    if (discount_type === "percentage" && (discount_value < 1 || discount_value > 100)) {
      return res.status(400).json({ success: false, message: "Percentage discount must be between 1 and 100." });
    }
    if (discount_type === "flat" && discount_value < 1) {
      return res.status(400).json({ success: false, message: "Flat discount must be at least Rs 1." });
    }
    if (new Date(expiry_date) <= new Date()) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be in the past." });
    }
    if (promo_scope === "specific_book" && book_id) {
      const books = await q("SELECT book_id FROM books WHERE book_id = ? AND author_id = ?", [book_id, authorId]);
      if (books.length === 0) return res.status(403).json({ success: false, message: "The selected book does not belong to your account." });
    }

    await q(
      `UPDATE promo_codes SET
        discount_type = ?, discount_value = ?, promo_scope = ?,
        book_id = ?, occasion = ?, expiry_date = ?,
        usage_limit = ?, per_reader_limit = ?, minimum_order_amount = ?
       WHERE promo_code_id = ? AND author_id = ?`,
      [
        discount_type, discount_value, promo_scope,
        promo_scope === "specific_book" ? book_id : null,
        occasion, expiry_date,
        usage_limit || 100, per_reader_limit || 1, minimum_order_amount || 0,
        id, authorId
      ]
    );

    res.json({ success: true, message: "Promo code updated." });
  } catch (err) {
    console.error("updatePromoCode error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Admin: Get All Promo Codes ────────────────────────────────────────────────
const getAdminPromoCodes = async (req, res) => {
  try {
    const rows = await q(
      `SELECT pc.*, a.full_name AS author_name, b.title AS book_title
       FROM promo_codes pc
       JOIN authors a ON a.author_id = pc.author_id
       LEFT JOIN books b ON b.book_id = pc.book_id
       ORDER BY pc.created_at DESC`
    );
    res.json({ success: true, promoCodes: rows });
  } catch (err) {
    console.error("getAdminPromoCodes error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Admin: Approve or Disable Promo Code ─────────────────────────────────────
const updatePromoCodeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'active' or 'disabled'." });
    }

    const result = await q("UPDATE promo_codes SET status = ? WHERE promo_code_id = ?", [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Promo code not found." });
    }

    res.json({ success: true, message: `Promo code ${status === "active" ? "approved" : "disabled"}.` });
  } catch (err) {
    console.error("updatePromoCodeStatus error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// ── Internal: Check Review Reward (fire-and-forget) ──────────────────────────
const checkReviewReward = async (bookId, readerId) => {
  try {
    // Find active review_reward promo code by this book's author
    const rows = await q(
      `SELECT pc.* FROM promo_codes pc
       JOIN books b ON b.author_id = pc.author_id
       WHERE b.book_id = ? AND pc.occasion = 'review_reward' AND pc.status = 'active'
         AND pc.expiry_date >= CURDATE()
         AND (pc.promo_scope = 'all_books' OR pc.book_id = ?)
       LIMIT 1`,
      [bookId, bookId]
    );

    if (rows.length === 0) return;

    const promo = rows[0];
    const discountText = promo.discount_type === "percentage"
      ? `${promo.discount_value}% off`
      : `Rs ${promo.discount_value} off`;

    await q(
      `INSERT INTO reader_notifications (reader_id, type, message, related_id)
       VALUES (?, 'promo_reward', ?, ?)`,
      [
        readerId,
        `🎁 You received promo code "${promo.code}" for writing a review! Get ${discountText} on your next purchase. Valid until ${new Date(promo.expiry_date).toLocaleDateString()}. Use it at checkout.`,
        promo.promo_code_id
      ]
    );
  } catch (err) {
    console.error("checkReviewReward error (non-blocking):", err.message);
  }
};

// ── Internal: Record Promo Usage ──────────────────────────────────────────────
const recordPromoUsage = async (promoCodeId, readerId, orderId) => {
  try {
    await q(
      "INSERT INTO promo_code_usages (promo_code_id, reader_id, order_id) VALUES (?, ?, ?)",
      [promoCodeId, readerId, orderId]
    );
    await q(
      "UPDATE promo_codes SET usage_count = usage_count + 1 WHERE promo_code_id = ?",
      [promoCodeId]
    );
  } catch (err) {
    console.error("recordPromoUsage error (non-blocking):", err.message);
  }
};

module.exports = {
  createPromoCode,
  getAuthorPromoCodes,
  deletePromoCode,
  updatePromoCode,
  validatePromoCode,
  getAdminPromoCodes,
  updatePromoCodeStatus,
  checkReviewReward,
  recordPromoUsage
};
