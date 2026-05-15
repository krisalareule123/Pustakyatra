# Bugfix Requirements Document

## Introduction

When a user clicks "Pay with Card" on the Payment page, the backend returns a 500 Internal Server Error with the message "Stripe secret key is not configured". This happens even though `STRIPE_SECRET_KEY` is present in `Backend/.env`. The root causes are: `dotenv` is loaded redundantly in `server.js` (called twice, once via `require` and once via `dotenv.config()`, which is harmless but indicates confusion), and more critically, the `createStripeSession` controller initializes the Stripe client lazily inside the route handler — meaning if the environment variable is not available at call time (e.g. due to load order issues or a missing blank line before the key in `.env`), the guard clause fires and returns the 500 error. The fix must ensure `dotenv` is loaded exactly once at the very top of `server.js`, that `STRIPE_SECRET_KEY` is reliably read, and that the Stripe client is initialized correctly so the checkout session is created and the user is redirected to Stripe without a crash. The existing eSewa payment flow must not be affected.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks "Pay with Card" and the frontend calls `POST /api/orders/stripe/create-session` THEN the server returns HTTP 500 with `{ "success": false, "message": "Stripe secret key is not configured" }`

1.2 WHEN `server.js` starts up THEN `dotenv.config()` is called twice (once via `const dotenv = require("dotenv"); dotenv.config();` and again via `require("dotenv").config();`), causing ambiguity about when environment variables are actually loaded

1.3 WHEN `createStripeSession` is invoked and `process.env.STRIPE_SECRET_KEY` is `undefined` at runtime THEN the server crashes or returns a 500 error instead of a clean diagnostic message

1.4 WHEN the Stripe checkout session creation fails due to an invalid or missing key THEN the server throws an unhandled error that propagates as a generic 500 response with no actionable message

### Expected Behavior (Correct)

2.1 WHEN a user clicks "Pay with Card" and the frontend calls `POST /api/orders/stripe/create-session` THEN the server SHALL create a Stripe checkout session and return `{ "url": "<stripe_checkout_url>" }` with HTTP 200, allowing the frontend to redirect the user to Stripe

2.2 WHEN `server.js` starts up THEN `require("dotenv").config()` SHALL be called exactly once as the very first statement, before any other `require` calls, ensuring all environment variables are available to all modules

2.3 WHEN `createStripeSession` is invoked and `process.env.STRIPE_SECRET_KEY` is present and valid THEN the Stripe client SHALL be initialized with that key and the checkout session SHALL be created without error

2.4 WHEN `process.env.STRIPE_SECRET_KEY` is missing or undefined at the time `createStripeSession` is called THEN the server SHALL return HTTP 500 with `{ "success": false, "message": "Stripe not configured" }` without crashing the process

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks "Pay with eSewa" THEN the system SHALL CONTINUE TO generate a valid signed eSewa payload and redirect the user to the eSewa payment page without any change in behavior

3.2 WHEN a user completes an eSewa payment and the callback is received THEN the system SHALL CONTINUE TO verify the HMAC signature, update the order status to `paid`, grant book access, and return the order details

3.3 WHEN a user applies a promo code before payment THEN the system SHALL CONTINUE TO apply the discount to both eSewa and Stripe payment flows using `discounted_total` from the order record

3.4 WHEN the backend server starts THEN the system SHALL CONTINUE TO load all existing routes (`/api/readers`, `/api/orders`, `/api/books`, `/api/authors`, `/api/reviews`, `/api/admin`) and serve them correctly

3.5 WHEN a user creates an order via `POST /api/orders` THEN the system SHALL CONTINUE TO insert the order and order items into the database and return the new `orderId`

---

## Bug Condition Pseudocode

**Bug Condition Function** — identifies requests that trigger the 500 error:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type StripeSessionRequest
  OUTPUT: boolean

  // Bug fires when the Stripe key is not available at handler invocation time,
  // which happens when dotenv is not loaded before the Stripe module is required,
  // or when the .env file has a formatting issue preventing key parsing
  RETURN process.env.STRIPE_SECRET_KEY = undefined OR process.env.STRIPE_SECRET_KEY = ""
END FUNCTION
```

**Property: Fix Checking**

```pascal
// For all requests where the bug condition was previously met,
// the fixed code must return a clean error (not crash) or succeed
FOR ALL X WHERE isBugCondition(X) DO
  result ← createStripeSession'(X)
  ASSERT result.status = 500
    AND result.body.success = false
    AND result.body.message = "Stripe not configured"
    AND no_crash(result)
END FOR
```

**Property: Preservation Checking**

```pascal
// For all requests where the key IS present (non-buggy inputs),
// the fixed code must behave identically to the original intent:
// create a session and return the Stripe URL
FOR ALL X WHERE NOT isBugCondition(X) DO
  result ← createStripeSession'(X)
  ASSERT result.status = 200
    AND result.body.url IS NOT NULL
    AND result.body.url STARTS WITH "https://checkout.stripe.com"
END FOR
```
