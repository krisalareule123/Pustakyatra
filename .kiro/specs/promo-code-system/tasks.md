# Implementation Plan: Promo Code System

## Overview

Implement the Promo Code System in order: database schema first, then backend controller and routes, then frontend pages and integrations, then wire everything together.

## Tasks

- [x] 1. Add promo tables command to db-tools.js
  - Add a `create-promo-tables` command to `Backend/scripts/db-tools.js` that creates `promo_codes`, `promo_code_usages`, and `reader_notifications` tables, and runs the `ALTER TABLE orders` to add `promo_code_id`, `discount_amount`, and `discounted_total` columns
  - Each CREATE uses `IF NOT EXISTS`; each ALTER uses `ADD COLUMN IF NOT EXISTS` to be idempotent
  - Add the command to the `commands` map and update the usage comment at the top of the file
  - _Requirements: 1.1, 3.4, 7.1, 8.2, 11.1_

- [-] 2. Implement `promoController.js` — author and validation endpoints
  - [x] 2.1 Create `Backend/src/controllers/promoController.js` with `createPromoCode`, `getAuthorPromoCodes`, and `deletePromoCode`
    - `createPromoCode`: validate all fields (discount_type/value ranges, expiry not in past, book ownership for specific_book scope), insert into `promo_codes` with `status = 'pending'`, then insert an admin notification row
    - `getAuthorPromoCodes`: return all codes for the authenticated author with all display fields
    - `deletePromoCode`: reject if status is not `pending` (Requirement 6.3 error message); otherwise delete
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 6.1, 6.2, 6.3_

  - [ ]* 2.2 Write property test for `createPromoCode` round-trip
    - **Property 1: Promo code creation round-trip**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write property test for code uniqueness and discount value validation
    - **Property 2: Code uniqueness is case-insensitive**
    - **Property 3: Discount value validation**
    - **Validates: Requirements 1.2, 1.5, 1.6, 4.5**

  - [ ]* 2.4 Write property test for author delete restriction
    - **Property 15: Author cannot delete non-pending codes**
    - **Validates: Requirements 6.3**

  - [x] 2.5 Add `validatePromoCode` to `promoController.js`
    - Accept `{ code, items, cartTotal, readerId }` in request body
    - Run all validation checks in order: status → expiry (auto-disable if expired) → usage_count vs usage_limit → per-reader usage count → minimum_order_amount → scope (applicable items exist) → occasion-specific (loyalty, first_reader)
    - Calculate `discount_amount` and `discounted_total` per the design formulas; return `{ discount_amount, discounted_total, promo_code_id }`
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.4, 9.1, 9.2, 10.1, 10.2_

  - [ ]* 2.6 Write property tests for validation rules
    - **Property 4: Inactive codes are always rejected at checkout**
    - **Property 9: Expiry enforcement**
    - **Property 8: Usage limit enforcement**
    - **Validates: Requirements 2.4, 2.5, 3.5, 3.6, 3.7, 4.2, 4.3, 6.4**

  - [ ]* 2.7 Write property tests for discount calculation and scope
    - **Property 5: Discount calculation correctness**
    - **Property 6: Scope-based applicable subtotal**
    - **Property 7: Scope rejection when no applicable items**
    - **Validates: Requirements 3.9, 3.10, 3.11, 3.12, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

  - [ ]* 2.8 Write property tests for occasion-specific eligibility
    - **Property 12: Loyalty code eligibility**
    - **Property 13: First-reader code eligibility**
    - **Validates: Requirements 9.1, 9.2, 10.1, 10.2**

  - [x] 2.9 Add `getAdminPromoCodes` and `updatePromoCodeStatus` to `promoController.js`
    - `getAdminPromoCodes`: JOIN with `authors` and `books` to return all codes with `author_name`, `book_title`, and all display fields required by Requirement 2.3
    - `updatePromoCodeStatus`: accept `{ status }` (active or disabled), update the row
    - _Requirements: 2.1, 2.2, 2.3, 7.3_

  - [x] 2.10 Add `checkReviewReward` and `recordPromoUsage` internal functions to `promoController.js`
    - `checkReviewReward(bookId, readerId)`: query for an active `review_reward` code by the book's author scoped to `all_books` or the specific `book_id`; if found, insert a row into `reader_notifications`
    - `recordPromoUsage(promoCodeId, readerId, orderId)`: insert into `promo_code_usages` and increment `usage_count` on `promo_codes`
    - Export both functions for use by other controllers
    - _Requirements: 7.1, 7.4, 8.1, 8.2, 8.3_

  - [ ]* 2.11 Write property tests for usage recording and review reward
    - **Property 10: Usage recorded only on successful payment**
    - **Property 14: Review reward notification delivery**
    - **Validates: Requirements 3.4, 7.1, 7.4, 8.1, 8.2**

- [-] 3. Register promo routes in author and admin route files
  - [x] 3.1 Add promo routes to `Backend/src/routes/author.routes.js`
    - Import `createPromoCode`, `getAuthorPromoCodes`, `deletePromoCode` from `promoController`
    - Add: `GET /promo-codes`, `POST /promo-codes`, `DELETE /promo-codes/:id` — all behind `authAuthor`
    - _Requirements: 1.1, 6.1, 6.2, 6.3_

  - [x] 3.2 Add promo routes to `Backend/src/routes/admin.routes.js`
    - Import `getAdminPromoCodes`, `updatePromoCodeStatus` from `promoController`
    - Add: `GET /promo-codes`, `PATCH /promo-codes/:id/status` — both behind `authAdmin`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Register the public validate route in `Backend/src/server.js` (or the reader routes file)
    - Add `POST /api/promo/validate` using `validatePromoCode` behind reader auth middleware
    - _Requirements: 3.1, 3.2_

- [-] 4. Integrate promo code into `orderController.js`
  - [x] 4.1 Modify `createOrder` to accept and persist promo fields
    - Accept optional `promoCodeId`, `discountAmount`, `discountedTotal` from request body
    - Store these three fields on the `orders` INSERT row
    - _Requirements: 11.1_

  - [ ]* 4.2 Write property test for promo fields persisted on order
    - **Property 11: Promo fields persisted on order**
    - **Validates: Requirements 11.1**

  - [x] 4.3 Modify `initiateEsewa` to use `discountedTotal` when present
    - Read `discounted_total` from the orders row; use it instead of `total_amount` when building the eSewa payload
    - _Requirements: 3.3_

  - [x] 4.4 Modify `verifyEsewa` and `simulatePayment` to call `recordPromoUsage`
    - After marking an order as paid, check if `promo_code_id` is set on the order; if so, call `recordPromoUsage(promoCodeId, readerId, orderId)` (non-blocking)
    - _Requirements: 3.4, 7.1, 7.4_

- [x] 5. Integrate `checkReviewReward` into `reviewController.js`
  - After the successful review INSERT, call `checkReviewReward(bookId, readerId)` in a non-blocking fire-and-forget pattern (do not await, do not fail the review response on error)
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Build `Frontend/src/pages/author/PromoCodes.jsx`
  - [x] 7.1 Create the author promo codes page with a creation form
    - Form fields: `code`, `discount_type` (select), `discount_value`, `promo_scope` (select), `book_id` (conditional select, shown only when scope is `specific_book`), `occasion` (select), `expiry_date`, `usage_limit`, `per_reader_limit`, `minimum_order_amount`
    - On submit, POST to `/api/authors/promo-codes` with the author token; show success or error message
    - _Requirements: 1.1, 1.3, 1.5, 1.6, 1.7_

  - [x] 7.2 Add the promo codes list table to the author page
    - Fetch GET `/api/authors/promo-codes` on mount; display `code`, `status`, `occasion`, `discount_type`, `discount_value`, `expiry_date`, `usage_count / usage_limit`
    - Show a Delete button only for `pending` codes; call DELETE `/api/authors/promo-codes/:id` and refresh the list
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Build `Frontend/src/pages/admin/PromoCodes.jsx`
  - Fetch GET `/api/admin/promo-codes` on mount; display a table with `code`, `author_name`, `book_title`, `occasion`, `discount_type`, `discount_value`, `expiry_date`, `usage_count / usage_limit`, `status`
  - Provide Approve (→ active) and Disable (→ disabled) action buttons per row; call PATCH `/api/admin/promo-codes/:id/status` and refresh
  - _Requirements: 2.1, 2.2, 2.3, 7.3_

- [-] 9. Add promo code input to `Frontend/src/pages/Payment.jsx`
  - [x] 9.1 Add promo code state and Apply button above the total row
    - Add state: `promoCode` (input string), `promoResult` (null | `{ discount_amount, discounted_total, promo_code_id }`), `promoError`, `promoLoading`
    - Render an input + "Apply" button; on click POST to `/api/promo/validate` with `{ code: promoCode, items, cartTotal: totalAmount }`; on success store `promoResult` and show discount breakdown; on error show `promoError`
    - _Requirements: 3.1, 3.2_

  - [x] 9.2 Pass promo fields through to order creation and eSewa initiation
    - When `promoResult` is set, pass `promoCodeId`, `discountAmount`, `discountedTotal` to `orderAPI.createOrder`
    - Pass `discountedTotal` (instead of `totalAmount`) to `orderAPI.initiateEsewa` and `orderAPI.simulatePayment`
    - Display the discounted total in the payment total row and order summary when a promo is applied
    - _Requirements: 3.3, 11.1, 11.3_

- [-] 10. Add navigation entries for Promo Codes
  - [x] 10.1 Add "Promo Codes" to `Frontend/src/components/author/AuthorSidebar.jsx`
    - Insert `{ path: "/author/promo-codes", icon: "🏷️", label: "Promo Codes" }` into the `menuItems` array (after Sales & Earnings)
    - _Requirements: 6.1_

  - [x] 10.2 Add "Promo Codes" to `Frontend/src/pages/admin/AdminLayout.jsx`
    - Insert `{ path: "/admin/promo-codes", icon: "🏷️", label: "Promo Codes" }` into the `NAV` array and add a matching entry to `PAGE_META`
    - _Requirements: 2.3_

- [x] 11. Register new routes in `Frontend/src/App.jsx`
  - Add `<Route path="/author/promo-codes" element={<PromoCodes />} />` inside the author layout route
  - Add `<Route path="/admin/promo-codes" element={<AdminPromoCodes />} />` inside the admin layout route
  - Import both new page components at the top of `App.jsx`
  - _Requirements: 6.1, 2.3_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use **fast-check** (already available in the JS ecosystem); tag each test with `// Feature: promo-code-system, Property N`
- The `create-promo-tables` db-tools command must be run once before starting the backend tasks
- `checkReviewReward` and `recordPromoUsage` are fire-and-forget — never let their errors bubble up to the caller
