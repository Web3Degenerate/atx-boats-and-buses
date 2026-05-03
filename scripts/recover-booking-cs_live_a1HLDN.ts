/**
 * Recover the missing Stripe booking for Checkout Session cs_live_a1HLDN...
 *
 * Run from the project root:
 *   npx tsx scripts/recover-booking-cs_live_a1HLDN.ts
 *
 * Required environment variables:
 *   DATABASE_URL
 *   NEXT_PUBLIC_BASE_URL
 *
 * The script is idempotent. If the booking already exists for this
 * stripe_session_id, it exits without inserting a duplicate.
 */

import { query, pool } from "@/lib/db";
import { createWaiverLink } from "@/lib/waiver";

const STRIPE_SESSION_ID =
  "cs_live_a1HLDNtKNWyBo0aJQWtpwP0SIOkjTp7R14Q7KvDdHbfARNuWpoNQFv4RDX";

type IdRow = {
  id: string;
};

async function main() {
  const existingBooking = await query<IdRow>(
    "SELECT id FROM bookings WHERE stripe_session_id = $1 LIMIT 1",
    [STRIPE_SESSION_ID]
  );

  if (existingBooking.rows[0]) {
    console.log(
      `Booking already exists for ${STRIPE_SESSION_ID}: ${existingBooking.rows[0].id}`
    );
    return;
  }

  const vehicleResult = await query<IdRow>(
    "SELECT id FROM vehicles WHERE slug = 'prevost-tour-bus' LIMIT 1"
  );
  const vehicleId = vehicleResult.rows[0]?.id;

  if (!vehicleId) {
    throw new Error("Could not find vehicle with slug prevost-tour-bus");
  }

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
      vehicleId,
      "Taylor Stearns",
      "tstearns@arcomurray.com",
      "7372337412",
      "2026-11-27",
      "2026-11-27",
      "10:00",
      "20:00",
      20,
      "We might need to shift our 10 hours since we are not sure what time the A&M game in College Station will be. We will let you know as soon as possible when the game schedule is released. Thank you!",
      96000,
      96000,
      384000,
      STRIPE_SESSION_ID,
      "pi_3TFFdYQOSlKhldsX0OhZq7yb",
      "cus_UDh1RMoRdj98tb"
    ]
  );

  const bookingId = insertResult.rows[0]?.id;
  if (!bookingId) {
    throw new Error("Booking insert did not return an id");
  }

  const waiverUrl = await createWaiverLink(bookingId, "bus", 20, "2026-11-27");

  console.log(`Recovered booking id: ${bookingId}`);
  console.log(`Waiver URL: ${waiverUrl}`);
}

main()
  .catch((error) => {
    console.error("Recovery failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
