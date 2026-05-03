/**
 * Report paid Stripe Checkout Sessions from the last 60 days that have
 * booking metadata but no matching bookings row.
 *
 * Run from the project root:
 *   npx tsx scripts/reconcile-stripe-bookings.ts
 *
 * Required environment variables:
 *   DATABASE_URL
 *   STRIPE_SECRET_KEY
 *
 * This script is read-only. It does not insert or update any rows.
 */

import Stripe from "stripe";
import { query, pool } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type BookingSessionRow = {
  stripe_session_id: string;
};

type MissingSession = {
  sessionId: string;
  paymentIntentId: string;
  customerEmail: string;
  vehicleId: string;
  date: string;
};

function getPaymentIntentId(
  paymentIntent: string | Stripe.PaymentIntent | null
): string {
  if (!paymentIntent) {
    return "";
  }

  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

async function main() {
  const createdGte = Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60;
  const paidSessions: Stripe.Checkout.Session[] = [];

  for await (const session of stripe.checkout.sessions.list({
    created: { gte: createdGte },
    limit: 100,
    status: "complete"
  })) {
    if (session.payment_status === "paid" && session.metadata?.vehicleId) {
      paidSessions.push(session);
    }
  }

  if (paidSessions.length === 0) {
    console.log("No paid Checkout Sessions with booking metadata found in the last 60 days.");
    return;
  }

  const sessionIds = paidSessions.map((session) => session.id);
  const bookingsResult = await query<BookingSessionRow>(
    "SELECT stripe_session_id FROM bookings WHERE stripe_session_id = ANY($1::text[])",
    [sessionIds]
  );
  const existingSessionIds = new Set(
    bookingsResult.rows.map((row) => row.stripe_session_id)
  );

  const missingSessions: MissingSession[] = paidSessions
    .filter((session) => !existingSessionIds.has(session.id))
    .map((session) => ({
      sessionId: session.id,
      paymentIntentId: getPaymentIntentId(session.payment_intent),
      customerEmail:
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.customerEmail ||
        "",
      vehicleId: session.metadata?.vehicleId || "",
      date: session.metadata?.date || ""
    }));

  if (missingSessions.length === 0) {
    console.log("No missing booking rows found for paid Checkout Sessions in the last 60 days.");
    return;
  }

  console.log(
    `Found ${missingSessions.length} paid Checkout Session(s) with booking metadata and no bookings row:`
  );
  console.table(missingSessions);
}

main()
  .catch((error) => {
    console.error("Reconciliation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
