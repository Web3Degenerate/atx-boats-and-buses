import { getBookingForAction, getBookingAlertRecipients } from "@/lib/booking-actions";
import { query } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";
import { getVehicleBySlug } from "@/lib/vehicles";
import { createWaiverLink } from "@/lib/waiver";

export type ManualBookingInput = {
  vehicleSlug: string;
  date: string;
  startTime: string;
  endDate: string;
  endTime: string;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  totalAmountCents: number;
  depositMode: "full" | "deposit";
};

export type ManualBookingResult =
  | { ok: true; bookingId: string; paymentUrl: string; waiverUrl: string }
  | { ok: false; error: string };

type InsertedBookingRow = {
  id: string;
};

function isValidIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

async function createPaymentSession(params: {
  bookingId: string;
  vehicleName: string;
  customerEmail: string;
  amountCents: number;
  baseUrl: string;
}): Promise<{ id: string; url: string } | null> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    payment_intent_data: {
      // Admin already approved by creating the booking — charge on payment, and
      // save the card so the balance cron can auto-charge deposit-mode bookings.
      setup_future_usage: "off_session"
    },
    customer_creation: "always",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: params.vehicleName
          },
          unit_amount: params.amountCents
        },
        quantity: 1
      }
    ],
    customer_email: params.customerEmail,
    success_url: `${params.baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.baseUrl}/booking/cancel`,
    metadata: {
      manualBookingId: params.bookingId
    }
  });

  return session.url ? { id: session.id, url: session.url } : null;
}

async function expireCheckoutSession(sessionId: string | null): Promise<void> {
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return;
  }

  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    const stripeCode = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

    // Completed and already-expired sessions cannot be expired again. The
    // database/webhook guards below still prevent either from charging twice.
    if (stripeCode !== "checkout_session_not_open") {
      console.error(`Failed to expire Checkout session ${sessionId}:`, error);
    }
  }
}

export async function createManualBooking(input: ManualBookingInput): Promise<ManualBookingResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return { ok: false, error: "NEXT_PUBLIC_BASE_URL is not configured." };
  }

  if (
    !isValidIsoDate(input.date) ||
    !isValidIsoDate(input.endDate) ||
    !isValidTime(input.startTime) ||
    !isValidTime(input.endTime)
  ) {
    return { ok: false, error: "Invalid date or time format." };
  }

  if (!input.customerName.trim() || !input.customerEmail.trim()) {
    return { ok: false, error: "Customer name and email are required." };
  }

  if (!Number.isInteger(input.totalAmountCents) || input.totalAmountCents <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const startDateTime = new Date(`${input.date}T${input.startTime}:00`);
  const endDateTime = new Date(`${input.endDate}T${input.endTime}:00`);

  if (!(endDateTime.getTime() > startDateTime.getTime())) {
    return { ok: false, error: "Return time must be after pickup time." };
  }

  // The 20% deposit option relies on the balance cron charging 2 days before the
  // trip — inside that window the full amount must be collected up front.
  const bookingDate = new Date(`${input.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilBooking = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (input.depositMode === "deposit" && daysUntilBooking <= 2) {
    return {
      ok: false,
      error: "The 20% deposit option requires the trip to be more than 2 days out — collect the full amount instead."
    };
  }

  const vehicle = await getVehicleBySlug(input.vehicleSlug);

  if (!vehicle) {
    return { ok: false, error: "Vehicle not found." };
  }

  if (!Number.isInteger(input.guestCount) || input.guestCount < 1 || input.guestCount > vehicle.capacity) {
    return { ok: false, error: `Guest count must be between 1 and ${vehicle.capacity}.` };
  }

  const blockedResult = await query(
    `
      SELECT 1
      FROM blocked_dates
      WHERE vehicle_id = $1
        AND (start_date + start_time) < ($4::date + $5::time)
        AND (end_date + end_time) > ($2::date + $3::time)
      LIMIT 1
    `,
    [vehicle.dbId, input.date, input.startTime, input.endDate, input.endTime]
  );

  if (blockedResult.rows[0]) {
    return { ok: false, error: "That time overlaps a blocked date range for this vehicle." };
  }

  const depositCents = input.depositMode === "full"
    ? input.totalAmountCents
    : Math.round(input.totalAmountCents * 0.2);
  const remainingCents = input.totalAmountCents - depositCents;
  const notes = input.notes?.trim() ? `[Manual] ${input.notes.trim()}` : "[Manual]";

  let bookingId: string;

  try {
    const insertResult = await query<InsertedBookingRow>(
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
          stripe_customer_id
        )
        VALUES ($1, $2, $3, $4, $5::date, $6::date, $7::time, $8::time, $9, $10, $11, $12, $13, 'confirmed', '')
        RETURNING id
      `,
      [
        vehicle.dbId,
        input.customerName.trim(),
        input.customerEmail.trim(),
        input.customerPhone?.trim() || "",
        input.date,
        input.endDate,
        input.startTime,
        input.endTime,
        input.guestCount,
        notes,
        input.totalAmountCents,
        depositCents,
        remainingCents
      ]
    );

    const insertedId = insertResult.rows[0]?.id;

    if (!insertedId) {
      return { ok: false, error: "Failed to create booking." };
    }

    bookingId = insertedId;
  } catch (error) {
    const postgresErrorCode = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

    if (postgresErrorCode === "23P01") {
      return { ok: false, error: "That time conflicts with an existing booking." };
    }

    console.error("Manual booking insert failed:", error);
    return { ok: false, error: "Failed to create booking." };
  }

  const waiverUrl = await createWaiverLink(bookingId, vehicle.type, input.guestCount, input.date);

  let paymentSession: { id: string; url: string } | null = null;

  try {
    paymentSession = await createPaymentSession({
      bookingId,
      vehicleName: vehicle.name,
      customerEmail: input.customerEmail.trim(),
      amountCents: depositCents,
      baseUrl
    });
  } catch (error) {
    console.error("Manual booking payment session failed:", error);
  }

  if (!paymentSession) {
    return {
      ok: false,
      error: `Booking and waiver were created, but the payment link failed — use "Resend payment link" on the booking to try again. Waiver: ${waiverUrl}`
    };
  }

  try {
    await query("UPDATE bookings SET stripe_session_id = $1 WHERE id = $2", [paymentSession.id, bookingId]);
  } catch (error) {
    console.error("Manual booking payment session save failed:", error);
    await expireCheckoutSession(paymentSession.id);
    return {
      ok: false,
      error: `Booking and waiver were created, but the payment link could not be saved — use "Resend payment link" to try again. Waiver: ${waiverUrl}`
    };
  }

  try {
    const balanceNote = remainingCents > 0
      ? ` Your remaining balance of ${formatCurrency(remainingCents)} will be automatically charged to your card on file 2 days before your trip.`
      : "";

    const emailResult = await getResend().emails.send({
      from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
      to: input.customerEmail.trim(),
      subject: "Your Booking — ATX Boats and Buses",
      text: `Hi ${input.customerName.trim()}, your booking for ${vehicle.name} on ${input.date} from ${input.startTime} to ${input.endTime} is reserved.\n\nPlease complete these two steps:\n\n1. Pay ${formatCurrency(depositCents)} securely here (link valid 24 hours): ${paymentSession.url}\n\n2. Every guest must sign the waiver before the trip: ${waiverUrl}\n\n${balanceNote ? balanceNote.trim() + "\n\n" : ""}Thank you, ATX Boats and Buses`
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }
  } catch (error) {
    console.error("Manual booking customer email failed:", error);
    return {
      ok: false,
      error: `Booking and payment link were created, but the customer email failed — use "Resend payment link" to try again. Payment link: ${paymentSession.url} Waiver: ${waiverUrl}`
    };
  }

  return { ok: true, bookingId, paymentUrl: paymentSession.url, waiverUrl };
}

export async function createPaymentLinkForBooking(bookingId: string): Promise<{ ok: true; paymentUrl: string } | { ok: false; error: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    return { ok: false, error: "NEXT_PUBLIC_BASE_URL is not configured." };
  }

  const booking = await getBookingForAction(bookingId);

  if (!booking) {
    return { ok: false, error: "Booking not found." };
  }

  if (booking.status !== "confirmed") {
    return { ok: false, error: `Booking is ${booking.status} — payment links are only for confirmed bookings.` };
  }

  if (booking.stripe_payment_intent_id) {
    return { ok: false, error: "This booking has already been paid." };
  }

  if (booking.deposit_amount <= 0) {
    return { ok: false, error: "This booking has no amount to collect." };
  }

  let paymentSession: { id: string; url: string } | null = null;

  try {
    paymentSession = await createPaymentSession({
      bookingId: booking.id,
      vehicleName: booking.vehicle_name,
      customerEmail: booking.customer_email,
      amountCents: booking.deposit_amount,
      baseUrl
    });
  } catch (error) {
    console.error("Payment link creation failed:", error);
  }

  if (!paymentSession) {
    return { ok: false, error: "Failed to create the payment link." };
  }

  try {
    const updateResult = await query(
      `UPDATE bookings
       SET stripe_session_id = $1
       WHERE id = $2
         AND stripe_payment_intent_id IS NULL
         AND stripe_session_id IS NOT DISTINCT FROM $3
       RETURNING id`,
      [paymentSession.id, booking.id, booking.stripe_session_id]
    );

    if (updateResult.rowCount !== 1) {
      await expireCheckoutSession(paymentSession.id);
      return { ok: false, error: "The booking changed while the payment link was being created. Please refresh and try again." };
    }

    await expireCheckoutSession(booking.stripe_session_id);
  } catch (error) {
    console.error("Payment link session save failed:", error);
    await expireCheckoutSession(paymentSession.id);
    return { ok: false, error: "Failed to save the payment link. Please try again." };
  }

  try {
    const emailResult = await getResend().emails.send({
      from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
      to: booking.customer_email,
      subject: "Payment Link — ATX Boats and Buses",
      text: `Hi ${booking.customer_name}, here is a fresh payment link for your ${booking.vehicle_name} booking on ${booking.date}: pay ${formatCurrency(booking.deposit_amount)} securely here (link valid 24 hours): ${paymentSession.url}\n\nThank you, ATX Boats and Buses`
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }
  } catch (error) {
    console.error("Payment link email failed:", error);
    return {
      ok: false,
      error: `The payment link was created, but the customer email failed. Please try again. Payment link: ${paymentSession.url}`
    };
  }

  return { ok: true, paymentUrl: paymentSession.url };
}

export async function notifyManualBookingPaid(bookingId: string): Promise<void> {
  const booking = await getBookingForAction(bookingId);

  if (!booking) {
    return;
  }

  const recipients = await getBookingAlertRecipients();

  for (const recipient of recipients) {
    try {
      const emailResult = await getResend().emails.send({
        from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
        to: recipient,
        subject: `Payment received: ${booking.vehicle_name} ${booking.date}`,
        text: `Manual booking paid — ${booking.customer_name} paid ${formatCurrency(booking.deposit_amount)} for ${booking.vehicle_name} on ${booking.date} ${booking.start_time.slice(0, 5)}-${booking.end_time.slice(0, 5)}.${booking.remaining_amount > 0 ? ` Balance of ${formatCurrency(booking.remaining_amount)} will auto-charge 2 days before the trip.` : ""}`
      });

      if (emailResult.error) {
        throw new Error(emailResult.error.message);
      }
    } catch (error) {
      console.error(`Manual booking paid alert failed for ${recipient}:`, error);
    }
  }
}
