// Local test helper: sends a signed fake Lemon Squeezy invoice webhook to
// your dev server. Never runs in production — it isn't imported anywhere.
//
// Usage:
//   node scripts/test-referral-webhook.mjs pay    <invoiceId> <userId> [amountCents]
//   node scripts/test-referral-webhook.mjs refund <invoiceId>
import { config } from "dotenv";
import crypto from "crypto";

config({ path: ".env.local" });

const [action, invoiceId, userId, amountArg] = process.argv.slice(2);
const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

if (!secret) {
  console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not set in .env.local");
  process.exit(1);
}
if (!["pay", "refund"].includes(action) || !invoiceId || (action === "pay" && !userId)) {
  console.error("Usage: node scripts/test-referral-webhook.mjs pay <invoiceId> <userId> [amountCents]");
  console.error("       node scripts/test-referral-webhook.mjs refund <invoiceId>");
  process.exit(1);
}

const amountCents = Number(amountArg ?? 1000);

const payload = {
  meta: {
    event_name: action === "pay" ? "subscription_payment_success" : "subscription_payment_refunded",
    custom_data: userId ? { user_id: userId } : undefined,
  },
  data: {
    type: "subscription-invoices",
    id: invoiceId,
    attributes: {
      subscription_id: "test-subscription",
      status: action === "pay" ? "paid" : "refunded",
      total_usd: amountCents,
      tax_usd: 0,
    },
  },
};

const body = JSON.stringify(payload);
const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

const res = await fetch("http://localhost:3000/api/webhooks/lemonsqueezy", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Signature": signature },
  body,
});

console.log(res.status, await res.text());