# Pustakyatra — Promo Code System
# Requirements Document

## Introduction

The Promo Code System for Pustakyatra enables authors to create discount codes for their books, admins to approve or disable those codes, and readers to apply them during checkout. The system supports a variety of promotional scenarios — festival offers, first-time reader discounts, loyalty rewards, limited-time promotions, rent-specific discounts, review-based rewards, and low-sales boosts. Discounts are applied before payment and the final discounted amount is sent to the eSewa payment gateway.

## Glossary

- **Promo_Code_System**: The overall feature managing creation, approval, validation, and redemption of promo codes.
- **Promo_Code**: A unique alphanumeric string that grants a discount when applied at checkout.
- **Author**: A verified Pustakyatra author who creates promo codes for their own books.
- **Admin**: The Pustakyatra platform administrator who approves or disables promo codes.
- **Reader**: A registered Pustakyatra user who applies promo codes during checkout.
- **Checkout**: The payment flow in Pustakyatra where a reader reviews their cart and proceeds to pay via eSewa.
- **Discount_Type**: Either `percentage` (e.g., 20% off) or `flat` (e.g., Rs 50 off).
- **Promo_Scope**: Defines which items a promo code applies to — `all_books` (any book by the author), `specific_book` (one book), or `rent_only` (rental transactions only).
- **Usage_Limit**: The maximum number of times a promo code can be redeemed across all readers.
- **Per_Reader_Limit**: The maximum number of times a single reader can redeem a promo code.
- **Promo_Status**: One of `pending` (awaiting admin approval), `active` (approved and usable), or `disabled` (deactivated by admin or expired).
- **Promo_Occasion**: A label describing the promotional context (e.g., `new_launch`, `dashain`, `tihar`, `new_year`, `teej`, `first_reader`, `loyalty`, `review_reward`, `low_sales`, `custom`).
- **Minimum_Order_Amount**: The minimum cart total required for a promo code to be applicable.
- **eSewa**: The payment gateway used by Pustakyatra, receiving the final discounted total.
- **Order**: A record in the `orders` table representing a reader's purchase or rental transaction.
- **Order_Item**: A record in the `order_items` table representing a single book within an order.

---

## Requirements

### Requirement 1: Author Creates a Promo Code

**User Story:** As an author, I want to create promo codes for my own books, so that I can run promotions to attract readers and boost sales.

#### Acceptance Criteria

1. WHEN an author submits a promo code creation request, THE Promo_Code_System SHALL store the code with fields: `code`, `discount_type`, `discount_value`, `promo_scope`, `book_id` (nullable), `occasion`, `expiry_date`, `usage_limit`, `per_reader_limit`, `minimum_order_amount`, and set `status` to `pending`.
2. THE Promo_Code_System SHALL enforce that the `code` field is unique across all promo codes (case-insensitive).
3. WHEN an author specifies `promo_scope` as `specific_book`, THE Promo_Code_System SHALL require a `book_id` that belongs to that author.
4. WHEN an author specifies `promo_scope` as `rent_only`, THE Promo_Code_System SHALL apply the discount only to `order_items` where `item_type = 'rent'`.
5. THE Promo_Code_System SHALL reject a promo code where `discount_type` is `percentage` and `discount_value` is not between 1 and 100.
6. THE Promo_Code_System SHALL reject a promo code where `discount_type` is `flat` and `discount_value` is less than 1.
7. THE Promo_Code_System SHALL reject a promo code where `expiry_date` is in the past at the time of creation.
8. WHEN a promo code is created successfully, THE Promo_Code_System SHALL notify the Admin of the new pending promo code via the existing admin notifications system.

---

### Requirement 2: Admin Approves or Disables a Promo Code

**User Story:** As an admin, I want to approve or disable promo codes, so that I can ensure only legitimate promotions are active on the platform.

#### Acceptance Criteria

1. WHEN the Admin approves a promo code, THE Promo_Code_System SHALL update the code's `status` to `active`.
2. WHEN the Admin disables a promo code, THE Promo_Code_System SHALL update the code's `status` to `disabled`.
3. THE Admin SHALL be able to view all promo codes with their `status`, `author_name`, `book_title` (if scoped), `occasion`, `discount_type`, `discount_value`, `expiry_date`, `usage_count`, and `usage_limit`.
4. WHILE a promo code has `status = 'pending'`, THE Promo_Code_System SHALL prevent readers from applying it at checkout.
5. WHILE a promo code has `status = 'disabled'`, THE Promo_Code_System SHALL prevent readers from applying it at checkout.

---

### Requirement 3: Reader Applies a Promo Code at Checkout

**User Story:** As a reader, I want to apply a promo code during checkout, so that I can get a discount on my purchase or rental.

#### Acceptance Criteria

1. WHEN a reader submits a promo code at checkout, THE Promo_Code_System SHALL validate the code and return the discounted total before payment is initiated.
2. WHEN a promo code is validated successfully, THE Promo_Code_System SHALL return the `discount_amount`, `discounted_total`, and `promo_code_id` to the frontend.
3. WHEN the reader proceeds to pay after applying a promo code, THE Promo_Code_System SHALL pass the `discounted_total` as the `total_amount` to the eSewa payment initiation endpoint.
4. WHEN eSewa payment is verified as successful, THE Promo_Code_System SHALL record the promo code usage by incrementing `usage_count` and storing a record in `promo_code_usages` with `reader_id`, `order_id`, and `used_at`.
5. IF a promo code's `expiry_date` is before the current date and time, THEN THE Promo_Code_System SHALL reject the code with the message "This promo code has expired."
6. IF a promo code's `usage_count` has reached `usage_limit`, THEN THE Promo_Code_System SHALL reject the code with the message "This promo code has reached its usage limit."
7. IF a reader has already used a promo code `per_reader_limit` times, THEN THE Promo_Code_System SHALL reject the code with the message "You have already used this promo code the maximum number of times."
8. IF the cart total is less than `minimum_order_amount`, THEN THE Promo_Code_System SHALL reject the code with the message "Minimum order amount of Rs [amount] is required for this promo code."
9. IF a promo code has `promo_scope = 'specific_book'` and none of the cart items match the `book_id`, THEN THE Promo_Code_System SHALL reject the code with the message "This promo code is not valid for the items in your cart."
10. IF a promo code has `promo_scope = 'rent_only'` and none of the cart items have `item_type = 'rent'`, THEN THE Promo_Code_System SHALL reject the code with the message "This promo code is only valid for rental orders."
11. IF a promo code has `promo_scope = 'all_books'` and none of the cart items belong to the promo code's author, THEN THE Promo_Code_System SHALL reject the code with the message "This promo code is not valid for the items in your cart."
12. WHEN a `flat` discount is applied and the discount amount exceeds the applicable cart subtotal, THE Promo_Code_System SHALL cap the discount at the applicable cart subtotal, resulting in a minimum `discounted_total` of Rs 1.

---

### Requirement 4: Promo Code Validation Rules

**User Story:** As a reader, I want clear feedback when a promo code is invalid, so that I understand why it cannot be applied.

#### Acceptance Criteria

1. IF a promo code string does not exist in the database, THEN THE Promo_Code_System SHALL return the error "Invalid promo code."
2. IF a promo code has `status = 'pending'`, THEN THE Promo_Code_System SHALL return the error "This promo code is not yet active."
3. IF a promo code has `status = 'disabled'`, THEN THE Promo_Code_System SHALL return the error "This promo code is no longer valid."
4. THE Promo_Code_System SHALL perform all validation checks (status, expiry, usage limit, per-reader limit, minimum order, scope) before returning a success response.
5. THE Promo_Code_System SHALL validate promo codes case-insensitively (e.g., "DASHAIN25" and "dashain25" are treated as the same code).

---

### Requirement 5: Discount Calculation

**User Story:** As a reader, I want to see the exact discounted price before I pay, so that I know how much I will be charged.

#### Acceptance Criteria

1. WHEN `discount_type` is `percentage`, THE Promo_Code_System SHALL calculate `discount_amount` as `(discount_value / 100) * applicable_subtotal`, rounded to 2 decimal places.
2. WHEN `discount_type` is `flat`, THE Promo_Code_System SHALL apply the `discount_value` directly as the `discount_amount`, capped at the applicable subtotal.
3. WHEN `promo_scope` is `rent_only`, THE Promo_Code_System SHALL calculate the discount only on the subtotal of items where `item_type = 'rent'`.
4. WHEN `promo_scope` is `specific_book`, THE Promo_Code_System SHALL calculate the discount only on the subtotal of items matching the `book_id`.
5. WHEN `promo_scope` is `all_books`, THE Promo_Code_System SHALL calculate the discount on the total cart subtotal of items belonging to the promo code's author.
6. THE Promo_Code_System SHALL return `discounted_total = max(1, cart_total - discount_amount)` to ensure the total is never zero or negative.

---

### Requirement 6: Author Promo Code Management

**User Story:** As an author, I want to view and manage my promo codes, so that I can track their performance and deactivate ones I no longer need.

#### Acceptance Criteria

1. THE Author SHALL be able to retrieve a list of all promo codes they have created, including `status`, `usage_count`, `usage_limit`, `expiry_date`, and `occasion`.
2. WHEN an author requests to delete a promo code with `status = 'pending'`, THE Promo_Code_System SHALL delete the code.
3. WHEN an author requests to delete a promo code with `status = 'active'` or `status = 'disabled'`, THE Promo_Code_System SHALL reject the deletion and return the message "Only pending promo codes can be deleted. Contact admin to disable active codes."
4. THE Promo_Code_System SHALL automatically set a promo code's `status` to `disabled` when its `expiry_date` passes, during the next validation attempt.

---

### Requirement 7: Promo Code Usage Tracking

**User Story:** As an author and admin, I want to track how promo codes are being used, so that I can measure the effectiveness of promotions.

#### Acceptance Criteria

1. THE Promo_Code_System SHALL store each successful promo code redemption in a `promo_code_usages` table with `usage_id`, `promo_code_id`, `reader_id`, `order_id`, and `used_at`.
2. THE Author SHALL be able to view the `usage_count` for each of their promo codes.
3. THE Admin SHALL be able to view the `usage_count` for all promo codes across the platform.
4. WHEN an order is cancelled or payment fails after a promo code was applied, THE Promo_Code_System SHALL NOT record a usage entry (usage is only recorded on successful payment verification).

---

### Requirement 8: Review-Based Promo Code Reward

**User Story:** As a reader, I want to receive a promo code after writing a review, so that I am rewarded for contributing to the community.

#### Acceptance Criteria

1. WHEN a reader submits a verified review for a book, THE Promo_Code_System SHALL check if the book's author has an active `review_reward` promo code for that book or for `all_books`.
2. WHEN a matching `review_reward` promo code exists, THE Promo_Code_System SHALL send the promo code details to the reader via the reader notifications panel in the dashboard.
3. IF no matching `review_reward` promo code exists for the reviewed book's author, THE Promo_Code_System SHALL take no action.

---

### Requirement 9: Loyalty Promo Code Eligibility

**User Story:** As an author, I want to create loyalty promo codes that only apply to readers who have previously purchased from me, so that I can reward my existing readers.

#### Acceptance Criteria

1. WHEN a reader applies a promo code with `occasion = 'loyalty'`, THE Promo_Code_System SHALL verify that the reader has at least one prior paid order containing a book by the promo code's author.
2. IF the reader has no prior paid orders from the promo code's author, THEN THE Promo_Code_System SHALL reject the code with the message "This promo code is for loyal readers who have previously purchased from this author."

---

### Requirement 10: First-Reader Promo Code Eligibility

**User Story:** As an author, I want to create first-reader promo codes that only apply to readers making their first purchase on Pustakyatra, so that I can attract new readers to the platform.

#### Acceptance Criteria

1. WHEN a reader applies a promo code with `occasion = 'first_reader'`, THE Promo_Code_System SHALL verify that the reader has no prior paid orders on the platform.
2. IF the reader has one or more prior paid orders, THEN THE Promo_Code_System SHALL reject the code with the message "This promo code is only valid for first-time purchases."

---

### Requirement 11: Promo Code Persistence in Orders

**User Story:** As a reader and admin, I want the applied promo code to be recorded with the order, so that there is a clear audit trail of discounts given.

#### Acceptance Criteria

1. WHEN an order is created with a promo code applied, THE Promo_Code_System SHALL store the `promo_code_id`, `discount_amount`, and `discounted_total` on the `orders` record.
2. THE Admin SHALL be able to see the applied promo code and discount amount when viewing order details in the Payments panel.
3. THE Reader SHALL be able to see the applied promo code and discount amount in their order history.
