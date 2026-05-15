# Stripe Payment Fix — Bugfix Design

## Overview

The bug causes `POST /api/orders/stripe/create-session` to return HTTP 500 with
`"Stripe secret key is not configured"` even when `STRIPE_SECRET_KEY` is present in
`Backend/.env`. Two root causes combine to produce this failure:

1. **`server.js` loads dotenv twice** — `dotenv.config()` is called once via
   `const dotenv = require("dotenv"); dotenv.config();` and again immediately after via
   `require("dotenv").config();`. While technically idempotent, this signals confusion
   about load order and makes it easy to accidentally move the second call below other
   `require` statements in future edits.

2. **`createStripeSession` initialises the Stripe client lazily** — `require("stripe")`
   is called inside the route handler, after the DB query callback. If `STRIPE_SECRET_KEY`
   is `undefined` at that point (e.g. due to a `.env` formatting issue or a future load-order
   regression), the guard clause fires and returns the 500 error instead of a Stripe session.

The fix is minimal and targeted: consolidate dotenv to a single `require("dotenv").config()`
as the very first line of `server.js`, and move the Stripe client initialisation to module
scope in `orderController.js` so it is resolved once at startup. The eSewa flow and all
other routes must remain completely unaffected.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the 500 error — `process.env.STRIPE_SECRET_KEY`
  is `undefined` or `""` at the time `createStripeSession` is invoked.
- **Property (P)**: The desired behaviour when the key IS present — a Stripe Checkout Session
  is created and its URL is returned with HTTP 200.
- **Preservation**: All existing behaviour that must remain unchanged by the fix — eSewa
  payment flow, order creation, promo code application, all other routes.
- **`createStripeSession`**: The async handler in `Backend/src/controllers/orderController.js`
  that creates a Stripe Checkout Session and returns `{ url }`.
- **`server.js`**: The Express entry point at `Backend/src/server.js` that bootstraps
  dotenv, middleware, and all route mounts.
- **Lazy initialisation**: The current pattern of calling `require("stripe")(key)` inside
  the route handler on every request, rather than once at module load time.
- **Module-scope initialisation**: Moving `const stripe = require("stripe")(key)` to the
  top of `orderController.js` so it is resolved when the module is first `require`d by
  Node.js — after dotenv has already run in `server.js`.

---

## Bug Details

### Bug Condition

The bug manifests when `POST /api/orders/stripe/create-session` is called and
`process.env.STRIPE_SECRET_KEY` is `undefined` or an empty string at handler invocation
time. This happens because:

- `server.js` calls `dotenv.config()` twice, creating ambiguity about which call is
  authoritative and making load-order fragile.
- `createStripeSession` reads `process.env.STRIPE_SECRET_KEY` inside a DB callback,
  meaning any load-order issue that leaves the key unset at that point triggers the guard.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X of type StripeSessionRequest
  OUTPUT: boolean

  RETURN process.env.STRIPE_SECRET_KEY = undefined
      OR process.env.STRIPE_SECRET_KEY = ""
END FUNCTION
```

### Examples

- **Example 1 — Key missing at runtime**: Server starts, dotenv second call is accidentally
  removed or reordered below `require("./routes/order.routes")`. `STRIPE_SECRET_KEY` is
  never set. User clicks "Pay with Card" → HTTP 500 `"Stripe secret key is not configured"`.

- **Example 2 — `.env` formatting issue**: A missing newline before `STRIPE_SECRET_KEY=sk_test_...`
  causes the key to be parsed as part of the previous value. `process.env.STRIPE_SECRET_KEY`
  is `undefined`. Same 500 error.

- **Example 3 — Valid key present (non-buggy)**: `STRIPE_SECRET_KEY=sk_test_abc123` is
  correctly parsed. User clicks "Pay with Card" → HTTP 200 `{ "url": "https://checkout.stripe.com/..." }`.

- **Edge case — Key present but invalid**: `STRIPE_SECRET_KEY` is set but the value is
  not a valid Stripe secret key. `isBugCondition` returns `false` (key is not empty), but
  Stripe's API rejects it. The outer `catch` block returns HTTP 500
  `"Failed to create Stripe session"` — this is acceptable and out of scope for this fix.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- eSewa payment initiation (`POST /api/orders/esewa/initiate`) must continue to generate
  a valid signed payload and return it with HTTP 200.
- eSewa payment verification (`POST /api/orders/esewa/verify`) must continue to verify
  the HMAC signature, mark the order as `paid`, grant book access, and return order details.
- Promo code discounts must continue to be applied to both eSewa and Stripe flows via
  `discounted_total` from the order record.
- All existing routes (`/api/readers`, `/api/orders`, `/api/books`, `/api/authors`,
  `/api/reviews`, `/api/admin`) must continue to load and respond correctly after server
  startup.
- Order creation (`POST /api/orders`) must continue to insert orders and order items and
  return `orderId`.

**Scope:**

All inputs that do NOT involve `STRIPE_SECRET_KEY` being absent should be completely
unaffected by this fix. This includes:

- All eSewa payment requests
- All non-payment API calls (auth, books, reviews, admin)
- Stripe requests when the key IS correctly configured (these should now succeed rather
  than fail)

---

## Hypothesized Root Cause

Based on reading `server.js` and `orderController.js` directly:

1. **Duplicate dotenv calls in `server.js`**: Lines 1–3 of `server.js` are:
   ```js
   const dotenv = require("dotenv");
   dotenv.config();
   require("dotenv").config();  // ← redundant second call
   ```
   The second call is harmless today but signals that the load order is not intentional.
   If a future edit moves the second call below a route `require`, the key may not be
   available when `orderController.js` is first evaluated.

2. **Lazy Stripe client initialisation inside a DB callback**: In `createStripeSession`,
   the Stripe client is created with `require("stripe")(process.env.STRIPE_SECRET_KEY)`
   inside the `db.query` callback — deep inside the async chain. If the key is not set
   at that point, the guard fires. Initialising at module scope (top of the file) makes
   the failure visible at startup rather than at request time.

3. **No startup validation**: There is no check at server startup that `STRIPE_SECRET_KEY`
   is present. A missing key is only discovered when the first Stripe request arrives.

4. **`.env` formatting sensitivity**: The current `.env` file may have a missing blank
   line or trailing whitespace before `STRIPE_SECRET_KEY`, causing `dotenv` to fail to
   parse it correctly. This is a secondary contributing factor.

---

## Correctness Properties

Property 1: Bug Condition — Stripe Session Returns 500 Without Crash When Key Is Missing

_For any_ request to `createStripeSession` where `isBugCondition` returns `true`
(i.e. `STRIPE_SECRET_KEY` is `undefined` or `""`), the fixed handler SHALL return
HTTP 500 with `{ "success": false, "message": "Stripe not configured" }` and SHALL NOT
throw an unhandled exception or crash the Node.js process.

**Validates: Requirements 2.4**

Property 2: Bug Condition — Stripe Session Succeeds When Key Is Present

_For any_ request to `createStripeSession` where `isBugCondition` returns `false`
(i.e. `STRIPE_SECRET_KEY` is a non-empty string), the fixed handler SHALL return
HTTP 200 with `{ "url": "<stripe_checkout_url>" }` where the URL starts with
`https://checkout.stripe.com`.

**Validates: Requirements 2.1, 2.3**

Property 3: Preservation — eSewa Flow Unaffected

_For any_ eSewa payment request (`initiateEsewa`, `verifyEsewa`), the fixed code SHALL
produce exactly the same response as the original code — same HTTP status, same payload
structure, same HMAC signature logic — regardless of whether `STRIPE_SECRET_KEY` is
present or absent.

**Validates: Requirements 3.1, 3.2**

Property 4: Preservation — All Other Routes Unaffected

_For any_ request to routes other than `POST /api/orders/stripe/create-session`, the
fixed code SHALL produce exactly the same response as the original code, preserving all
existing functionality.

**Validates: Requirements 3.3, 3.4, 3.5**

---

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

---

**File**: `Backend/src/server.js`

**Change 1 — Consolidate dotenv to a single call at the very top**

Remove the duplicate `require("dotenv").config()` and keep exactly one call as the
first statement in the file, before any other `require`:

```js
// BEFORE (lines 1-3):
const dotenv = require("dotenv");
dotenv.config();
require("dotenv").config();

// AFTER (line 1 only):
require("dotenv").config();
```

This ensures `process.env` is fully populated before any module (including
`orderController.js`) is loaded by Node's module system.

---

**File**: `Backend/src/controllers/orderController.js`

**Change 2 — Initialise Stripe client at module scope**

Move the Stripe client initialisation from inside the `db.query` callback to the top
of the file, immediately after the existing `require` statements. Guard it so that a
missing key does not crash the module load:

```js
// Add near the top of the file, after existing requires:
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;
```

**Change 3 — Update `createStripeSession` to use the module-scope client**

Replace the lazy initialisation and guard inside the handler with a check against the
module-scope `stripe` variable:

```js
// BEFORE (inside db.query callback):
if (!process.env.STRIPE_SECRET_KEY) {
  return res.status(500).json({ success: false, message: "Stripe secret key is not configured" });
}
console.log("Stripe key loaded:", !!process.env.STRIPE_SECRET_KEY);
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// AFTER (inside db.query callback):
if (!stripe) {
  return res.status(500).json({ success: false, message: "Stripe not configured" });
}
```

**Change 4 — Add startup log for Stripe key presence**

Move the existing debug log from inside the handler to `server.js` startup, so key
presence is confirmed at boot rather than per-request:

```js
// In server.js, after require("dotenv").config():
console.log("Stripe key loaded:", !!process.env.STRIPE_SECRET_KEY);
```

(The existing `console.log` in `server.js` already does this — keep it, remove the
duplicate inside `createStripeSession`.)

---

### Summary of File Changes

| File | Change |
|------|--------|
| `Backend/src/server.js` | Remove duplicate `dotenv.config()` call; keep single call as first line |
| `Backend/src/controllers/orderController.js` | Add module-scope `stripe` initialisation; update guard in `createStripeSession` |

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate the bug on unfixed code, then verify the fix works correctly and preserves
existing behaviour.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix.
Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that call `createStripeSession` with `process.env.STRIPE_SECRET_KEY`
explicitly set to `undefined`, and assert that the response is a clean 500 (not a crash).
Run these tests on the UNFIXED code to observe the failure mode and confirm the guard
clause is the only thing preventing a crash.

**Test Cases**:

1. **Missing key test**: Set `process.env.STRIPE_SECRET_KEY = undefined`, call
   `createStripeSession` with a valid `order_id` — expect HTTP 500 with
   `"Stripe secret key is not configured"` (will pass on unfixed code because the guard
   exists, but confirms the guard message matches requirements).

2. **Empty key test**: Set `process.env.STRIPE_SECRET_KEY = ""`, call
   `createStripeSession` — expect HTTP 500 (may fail on unfixed code if the guard only
   checks `!process.env.STRIPE_SECRET_KEY` and `""` is falsy — confirm behaviour).

3. **Duplicate dotenv call test**: Verify that calling `dotenv.config()` twice does not
   overwrite already-set env vars (confirm idempotency, document the finding).

4. **Load order test**: Simulate requiring `orderController.js` before `dotenv.config()`
   runs — observe whether `STRIPE_SECRET_KEY` is `undefined` at module scope (will fail
   on unfixed code, confirming the lazy-init risk).

**Expected Counterexamples**:

- On unfixed code with `STRIPE_SECRET_KEY = undefined`: guard fires, returns 500 with
  `"Stripe secret key is not configured"` — confirms bug condition.
- On unfixed code with load-order simulation: `stripe` would be initialised with
  `undefined`, causing a Stripe SDK error rather than a clean 500 — confirms the need
  for module-scope guard.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function
produces the expected behaviour.

**Pseudocode:**

```
FOR ALL X WHERE isBugCondition(X) DO
  result := createStripeSession_fixed(X)
  ASSERT result.status = 500
    AND result.body.success = false
    AND result.body.message = "Stripe not configured"
    AND no_crash(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
function produces the same result as the original function.

**Pseudocode:**

```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT createStripeSession_original(X) = createStripeSession_fixed(X)
END FOR

FOR ALL esewaRequest DO
  ASSERT initiateEsewa_original(esewaRequest) = initiateEsewa_fixed(esewaRequest)
  ASSERT verifyEsewa_original(esewaRequest) = verifyEsewa_fixed(esewaRequest)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking
because:

- It generates many test cases automatically across the input domain (random order IDs,
  amounts, promo states).
- It catches edge cases that manual unit tests might miss (e.g. `discounted_total = 0`,
  very large amounts, orders with many items).
- It provides strong guarantees that eSewa behaviour is unchanged for all inputs.

**Test Plan**: Observe eSewa handler behaviour on UNFIXED code first (it should work
correctly), then write property-based tests capturing that behaviour, then re-run after
the fix to confirm no regression.

**Test Cases**:

1. **eSewa initiation preservation**: Generate random valid orders and verify
   `initiateEsewa` returns the same signed payload structure before and after the fix.
2. **eSewa verification preservation**: Verify `verifyEsewa` HMAC logic is unchanged.
3. **Order creation preservation**: Verify `createOrder` inserts correctly and returns
   `orderId` before and after the fix.
4. **Promo code preservation**: Verify `discounted_total` is used correctly in both
   eSewa and Stripe flows after the fix.

### Unit Tests

- Test `createStripeSession` with `STRIPE_SECRET_KEY = undefined` → expect clean 500.
- Test `createStripeSession` with `STRIPE_SECRET_KEY = ""` → expect clean 500.
- Test `createStripeSession` with a valid key and a mocked Stripe SDK → expect 200 with
  a URL.
- Test that `server.js` calls `dotenv.config()` exactly once (import order test).
- Test that the module-scope `stripe` variable is `null` when key is absent and a
  `Stripe` instance when key is present.

### Property-Based Tests

- Generate random `order_id` values and verify `createStripeSession` with a missing key
  always returns the same clean 500 structure (no variation in error shape).
- Generate random eSewa order payloads and verify `initiateEsewa` produces a valid
  HMAC-signed response for all of them, before and after the fix.
- Generate random non-Stripe requests and verify all other routes return the same
  response before and after the fix.

### Integration Tests

- Start the server with a valid `STRIPE_SECRET_KEY` in the environment and call
  `POST /api/orders/stripe/create-session` with a real order — verify HTTP 200 and a
  Stripe checkout URL.
- Start the server with `STRIPE_SECRET_KEY` absent and call the same endpoint — verify
  HTTP 500 with `"Stripe not configured"` and no server crash.
- Call `POST /api/orders/esewa/initiate` after applying the fix — verify the eSewa
  payload is identical to pre-fix behaviour.
- Verify server startup logs show `"Stripe key loaded: true"` when the key is present
  and `"Stripe key loaded: false"` when absent.
