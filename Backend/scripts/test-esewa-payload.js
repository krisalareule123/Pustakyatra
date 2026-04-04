/**
 * Generates and prints the exact eSewa payload that would be sent.
 * Run: node Backend/scripts/test-esewa-payload.js
 * Then manually POST this to https://rc-epay.esewa.com.np/api/epay/main/v2/form
 * to verify the payload is accepted.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const crypto = require("crypto");

const secret      = process.env.ESEWA_SECRET_KEY;
const productCode = process.env.ESEWA_PRODUCT_CODE;
const paymentUrl  = process.env.ESEWA_PAYMENT_URL;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const orderId         = 999;                          // test order id
const amount          = "100.00";
const taxAmount       = "0";
const serviceCharge   = "0";
const deliveryCharge  = "0";
const totalAmount     = amount;
const transactionUuid = `PK${orderId}T${Date.now()}`;

const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
const signature = crypto.createHmac("sha256", secret).update(signatureMessage).digest("base64");

const payload = {
  amount,
  tax_amount:               taxAmount,
  product_service_charge:   serviceCharge,
  product_delivery_charge:  deliveryCharge,
  product_code:             productCode,
  total_amount:             totalAmount,
  transaction_uuid:         transactionUuid,
  success_url:              `${frontendUrl}/payment/success`,
  failure_url:              `${frontendUrl}/payment/failure?orderId=${orderId}&totalAmount=${amount}&reason=failed`,
  signed_field_names:       "total_amount,transaction_uuid,product_code",
  signature,
};

console.log("\n=== eSewa Test Payload ===");
console.log("Payment URL  :", paymentUrl);
console.log("Product Code :", productCode);
console.log("Secret Key   :", secret ? secret.slice(0, 4) + "****" : "MISSING");
console.log("Sig Message  :", signatureMessage);
console.log("Signature    :", signature);
console.log("\nFull payload:");
Object.entries(payload).forEach(([k, v]) => console.log(`  ${k.padEnd(28)} = ${v}`));

// Check for common issues
console.log("\n=== Validation ===");
if (!productCode) console.error("❌ ESEWA_PRODUCT_CODE is missing in .env");
else if (productCode !== "EPAYTEST") console.warn("⚠️  product_code is not EPAYTEST — using:", productCode);
else console.log("✅ product_code = EPAYTEST");

if (!secret) console.error("❌ ESEWA_SECRET_KEY is missing in .env");
else console.log("✅ ESEWA_SECRET_KEY is set");

if (!paymentUrl) console.error("❌ ESEWA_PAYMENT_URL is missing in .env");
else if (!paymentUrl.includes("rc-epay")) console.warn("⚠️  Not using sandbox URL:", paymentUrl);
else console.log("✅ Using sandbox URL:", paymentUrl);

console.log("\n=== HTML Form (copy-paste to test) ===");
console.log(`<form method="POST" action="${paymentUrl}">`);
Object.entries(payload).forEach(([k, v]) =>
  console.log(`  <input type="hidden" name="${k}" value="${v}">`)
);
console.log(`  <button type="submit">Pay with eSewa</button>`);
console.log(`</form>`);
