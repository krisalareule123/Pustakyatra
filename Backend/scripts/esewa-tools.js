/**
 * eSewa payment testing tools for Pustakyatra.
 *
 * Usage:
 *   node Backend/scripts/esewa-tools.js <command>
 *
 * Commands:
 *   payload    — Generate and validate a test eSewa payment payload
 *   html-form  — Print an HTML form you can open in a browser to test eSewa directly
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const crypto = require("crypto");

const cmd = process.argv[2];

const secret      = process.env.ESEWA_SECRET_KEY;
const productCode = process.env.ESEWA_PRODUCT_CODE;
const paymentUrl  = process.env.ESEWA_PAYMENT_URL;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

function buildPayload(orderId = 999, amount = "100.00") {
  const transactionUuid = `PK${orderId}T${Date.now()}`;
  const signatureMessage = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = crypto.createHmac("sha256", secret).update(signatureMessage).digest("base64");

  return {
    amount,
    tax_amount:              "0",
    product_service_charge:  "0",
    product_delivery_charge: "0",
    product_code:            productCode,
    total_amount:            amount,
    transaction_uuid:        transactionUuid,
    success_url:             `${frontendUrl}/payment/success`,
    failure_url:             `${frontendUrl}/payment/failure?orderId=${orderId}&totalAmount=${amount}&reason=failed`,
    signed_field_names:      "total_amount,transaction_uuid,product_code",
    signature,
    _signatureMessage:       signatureMessage,
  };
}

// ── payload ───────────────────────────────────────────────────────────────────
function showPayload() {
  const p = buildPayload();
  console.log("\n=== eSewa Test Payload ===");
  console.log("Payment URL  :", paymentUrl);
  console.log("Product Code :", productCode);
  console.log("Secret Key   :", secret ? secret.slice(0, 4) + "****" : "MISSING");
  console.log("Sig Message  :", p._signatureMessage);
  console.log("Signature    :", p.signature);
  console.log("\nFull payload:");
  Object.entries(p).filter(([k]) => !k.startsWith("_"))
    .forEach(([k, v]) => console.log(`  ${k.padEnd(28)} = ${v}`));

  console.log("\n=== Validation ===");
  if (!productCode) console.error("❌ ESEWA_PRODUCT_CODE missing in .env");
  else if (productCode !== "EPAYTEST") console.warn("⚠️  product_code is not EPAYTEST:", productCode);
  else console.log("✅ product_code = EPAYTEST");

  if (!secret) console.error("❌ ESEWA_SECRET_KEY missing in .env");
  else console.log("✅ ESEWA_SECRET_KEY is set");

  if (!paymentUrl) console.error("❌ ESEWA_PAYMENT_URL missing in .env");
  else if (!paymentUrl.includes("rc-epay")) console.warn("⚠️  Not using sandbox URL:", paymentUrl);
  else console.log("✅ Using sandbox URL:", paymentUrl);
}

// ── html-form ─────────────────────────────────────────────────────────────────
function showHtmlForm() {
  const p = buildPayload();
  console.log("\n<!-- Save this as a .html file and open in browser to test eSewa -->");
  console.log(`<form method="POST" action="${paymentUrl}">`);
  Object.entries(p).filter(([k]) => !k.startsWith("_"))
    .forEach(([k, v]) => console.log(`  <input type="hidden" name="${k}" value="${v}">`));
  console.log(`  <button type="submit">Pay Rs 100 with eSewa</button>`);
  console.log(`</form>`);
  console.log("\n<!-- Test credentials: ID 9806800001  Password Nepal@123  MPIN 1122 -->");
}

// ── router ────────────────────────────────────────────────────────────────────
const commands = { payload: showPayload, "html-form": showHtmlForm };

if (!cmd || !commands[cmd]) {
  console.log("Usage: node Backend/scripts/esewa-tools.js <command>\n");
  console.log("Commands:", Object.keys(commands).join(", "));
  process.exit(0);
}

commands[cmd]();
