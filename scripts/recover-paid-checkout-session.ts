/**
 * Recover a paid Stripe Checkout Session into the bookings table.
 *
 * Run from the project root:
 *   npx tsx scripts/recover-paid-checkout-session.ts <checkoutSessionId>
 *
 * Required environment variables:
 *   DATABASE_URL
 *   STRIPE_SECRET_KEY
 *   NEXT_PUBLIC_BASE_URL
 */

import { vehicles as VEHICLES } from "@/data/vehicles";
import { query, pool } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { createWaiverLink } from "@/lib/waiver";

type IdRow = {
  id: string;
};

type Metadata = Record<string, string | undefined>;

function requireMetadata(metadata: Metadata, keys: string[]): void {
  const missing = keys.filter((key) => !metadata[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required session metadata: ${missing.join(", ")}`);
  }
}

function parseCents(value: string | undefined, fieldName: string): number {
  if (!value?.trim()) {
    throw new Error(`Missing required amount metadata: ${fieldName}`);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid amount metadata ${fieldName}: ${value}`);
  }

  return parsed;
}

function parsePositiveInteger(value: string | undefined, fieldName: string): number {
  if (!value?.trim()) {
    throw new Error(`Missing required session metadata: ${fieldName}`);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid session metadata ${fieldName}: ${value}`);
  }

  return parsed;
}

function getStripeObjectId(value: string | { id?: string } | null): string {
  if (typeof value === "string") {
    return value;
  }

  return value?.id || "";
}

async function main() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error("Usage: npx tsx scripts/recover-paid-checkout-session.ts <checkoutSessionId>");
    process.exitCode = 1;
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "payment_intent", "customer"]
  });

  if (session.status !== "complete") {
    throw new Error(`Checkout Session ${session.id} is not complete; status is "${session.status}"`);
  }

  if (session.payment_status !== "paid") {
    throw new Error(`Checkout Session ${session.id} is not paid; payment_status is "${session.payment_status}"`);
  }

  const existingBooking = await query<IdRow>(
    "SELECT id FROM bookings WHERE stripe_session_id = $1 LIMIT 1",
    [session.id]
  );

  if (existingBooking.rows[0]) {
    console.log(`Booking already exists: ${existingBooking.rows[0].id}`);
    return;
  }

  const metadata = session.metadata || {};
  const startDate = metadata.startDate || metadata.date;
  const normalizedMetadata: Metadata = {
    ...metadata,
    startDate
  };

  requireMetadata(normalizedMetadata, [
    "vehicleId",
    "startDate",
    "endDate",
    "startTime",
    "endTime",
    "customerName",
    "customerEmail",
    "customerPhone"
  ]);

  const guestCount = parsePositiveInteger(metadata.guestCount, "guestCount");
  const vehicleKey = normalizedMetadata.vehicleId as string;
  const matchedVehicle = VEHICLES.find((vehicle) => vehicle.id === vehicleKey || vehicle.slug === vehicleKey);

  if (!matchedVehicle) {
    throw new Error(`vehicleId "${vehicleKey}" was not found in data/vehicles.ts`);
  }

  const vehicleResult = await query<IdRow>("SELECT id FROM vehicles WHERE slug = $1 LIMIT 1", [
    matchedVehicle.slug
  ]);
  const dbVehicleId = vehicleResult.rows[0]?.id;

  if (!dbVehicleId) {
    throw new Error(`Vehicle row missing in database for slug "${matchedVehicle.slug}"`);
  }

  const depositAmount = session.amount_total ?? parseCents(metadata.depositAmount, "depositAmount");
  const remainingAmount = metadata.remainingAmount ? parseCents(metadata.remainingAmount, "remainingAmount") : 0;
  const totalPrice = metadata.totalPrice ? parseCents(metadata.totalPrice, "totalPrice") : depositAmount + remainingAmount;
  const paymentIntentId = getStripeObjectId(session.payment_intent);
  const stripeCustomerId = getStripeObjectId(session.customer);

  const insertResult = await query<IdRow>(
    `
      INSERT INTO bookings (
        vehicle_id,
        customer_name,
        customer_email,
        customer_phone,
        date,
        end_date,
        start_time,
        end_time,
        guest_count,
        notes,
        total_price,
        deposit_amount,
        remaining_amount,
        status,
        stripe_session_id,
        stripe_payment_intent_id,
        stripe_customer_id
      )
      VALUES ($1, $2, $3, $4, $5::date, $6::date, $7::time, $8::time, $9, $10, $11, $12, $13, 'confirmed', $14, $15, $16)
      RETURNING id
    `,
    [
      dbVehicleId,
      normalizedMetadata.customerName,
      normalizedMetadata.customerEmail,
      normalizedMetadata.customerPhone,
      normalizedMetadata.startDate,
      normalizedMetadata.endDate,
      normalizedMetadata.startTime,
      normalizedMetadata.endTime,
      guestCount,
      metadata.notes || null,
      totalPrice,
      depositAmount,
      remainingAmount,
      session.id,
      paymentIntentId,
      stripeCustomerId
    ]
  );

  const bookingId = insertResult.rows[0]?.id;
  if (!bookingId) {
    throw new Error("Booking insert did not return an id");
  }

  const waiverUrl = await createWaiverLink(bookingId, matchedVehicle.type, guestCount, normalizedMetadata.startDate as string);

  console.log(`Inserted booking id: ${bookingId}`);
  console.log(`Waiver URL: ${waiverUrl}`);
}

main()
  .catch((error) => {
    console.error("Recovery failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
