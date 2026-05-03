/**
 * Print the key fields of a Stripe Checkout Session so you can decide whether
 * it originated from atxboatsandbuses.com and whether it actually got paid.
 *
 * Run from the project root:
 *   set -a; source .env.local; set +a; npx tsx scripts/inspect-session.ts <sessionId>
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY
 *
 * Read-only. Does not touch the database.
 */

import { stripe } from "@/lib/stripe";

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    throw new Error("Usage: npx tsx scripts/inspect-session.ts <sessionId>");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const createdIso = new Date(session.created * 1000).toISOString();
  const expiresIso = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : "n/a";

  const isOurs =
    typeof session.success_url === "string" &&
    session.success_url.includes("atxboatsandbuses.com") &&
    Boolean(session.metadata?.vehicleId);

  console.log("Session id:        ", session.id);
  console.log("Live mode:         ", session.livemode);
  console.log("Status:            ", session.status);
  console.log("Payment status:    ", session.payment_status);
  console.log("Created:           ", createdIso);
  console.log("Expires:           ", expiresIso);
  console.log("Amount total (¢):  ", session.amount_total);
  console.log("Currency:          ", session.currency);
  console.log("Customer email:    ", session.customer_details?.email || session.customer_email || "n/a");
  console.log("Customer name:     ", session.customer_details?.name || "n/a");
  console.log("Customer phone:    ", session.customer_details?.phone || "n/a");
  console.log("Stripe customer:   ", typeof session.customer === "string" ? session.customer : session.customer?.id ?? "n/a");
  console.log("Payment intent:    ", typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? "n/a");
  console.log("Success URL:       ", session.success_url);
  console.log("Cancel URL:        ", session.cancel_url);
  console.log("Looks like ours:   ", isOurs);
  console.log("");
  console.log("Metadata:");
  console.log(JSON.stringify(session.metadata ?? {}, null, 2));
  console.log("");

  if (session.payment_status !== "paid") {
    console.log(`NOTE: payment_status is "${session.payment_status}" — no money was charged. Do NOT insert a booking row.`);
  }
  if (session.status !== "complete") {
    console.log(`NOTE: status is "${session.status}" — checkout did not complete.`);
  }
}

main().catch((error) => {
  console.error("Inspect failed:", error);
  process.exitCode = 1;
});
