import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { vehicles } from "@/data/vehicles";
import { getBookingForAction, sendBookingRequestAlerts } from "@/lib/booking-actions";
import { createBookingActionToken } from "@/lib/booking-approval";
import { query } from "@/lib/db";
import { notifyManualBookingPaid } from "@/lib/manual-booking";
import { getResend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

type VehicleRow = {
  id: string;
};

type InsertedBookingRow = {
  id: string;
};

type ExistingBookingRow = {
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

async function notifyAdminOfWebhookFailure(params: {
  reason: string;
  sessionId: string;
  paymentIntentId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  errorMessage?: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) {
    return;
  }
  try {
    await getResend().emails.send({
      from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
      to: adminEmail,
      subject: `URGENT: Stripe webhook failed to record booking (${params.sessionId})`,
      text: [
        `Reason: ${params.reason}`,
        `Session: ${params.sessionId}`,
        `Payment Intent: ${params.paymentIntentId ?? "n/a"}`,
        `Customer: ${params.customerEmail ?? "n/a"}`,
        params.errorMessage ? `Error: ${params.errorMessage}` : "",
        params.metadata ? `Metadata: ${JSON.stringify(params.metadata, null, 2)}` : ""
      ]
        .filter(Boolean)
        .join("\n\n")
    });
  } catch (alertError) {
    console.error("Failed to send admin webhook-failure alert:", alertError);
  }
}

async function sendRequestReceivedEmail(params: {
  customerName: string;
  customerEmail: string;
  vehicleName: string;
  date: string;
  startTime: string;
  endTime: string;
  depositAmount: number;
}): Promise<void> {
  await getResend().emails.send({
    from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
    to: params.customerEmail,
    subject: "Booking Request Received — ATX Boats and Buses",
    text: `Hi ${params.customerName}, we received your booking request for ${params.vehicleName} on ${params.date} from ${params.startTime} to ${params.endTime}. A hold of ${formatCurrency(params.depositAmount)} has been placed on your card — you will not be charged unless your booking is approved. We review requests quickly and you will receive a confirmation email shortly. Thank you, ATX Boats and Buses`
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook configuration" }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    // Manual admin bookings: the row already exists as 'confirmed' — this payment
    // session just settles it. Record the Stripe ids and alert the admins.
    if (metadata.manualBookingId) {
      const manualPaymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
      const manualCustomerId = typeof session.customer === "string" ? session.customer : "";

      try {
        const updateResult = await query(
          `
            UPDATE bookings
            SET stripe_session_id = $1, stripe_payment_intent_id = $2, stripe_customer_id = $3
            WHERE id = $4
              AND stripe_payment_intent_id IS NULL
            RETURNING id
          `,
          [session.id, manualPaymentIntentId, manualCustomerId, metadata.manualBookingId]
        );

        // Stripe retries webhook deliveries. Only the delivery that settles the
        // still-unpaid booking should send the payment notification.
        if (updateResult.rowCount === 1) {
          await notifyManualBookingPaid(metadata.manualBookingId);
        } else if (manualPaymentIntentId) {
          const paidBookingResult = await query<{ stripe_payment_intent_id: string | null }>(
            "SELECT stripe_payment_intent_id FROM bookings WHERE id = $1 LIMIT 1",
            [metadata.manualBookingId]
          );
          const recordedPaymentIntentId = paidBookingResult.rows[0]?.stripe_payment_intent_id;

          // A customer may finish an older Checkout tab at the same instant an
          // admin resends a link. Refund any later duplicate completion.
          if (recordedPaymentIntentId && recordedPaymentIntentId !== manualPaymentIntentId) {
            await stripe.refunds.create(
              { payment_intent: manualPaymentIntentId },
              { idempotencyKey: `manual-booking-duplicate-${session.id}` }
            );
          }
        }
      } catch (error) {
        console.error("Manual booking payment update failed:", error);
        await notifyAdminOfWebhookFailure({
          reason: "Manual booking payment received but the booking row update failed — reconcile manually.",
          sessionId: session.id,
          paymentIntentId: manualPaymentIntentId,
          customerEmail: session.customer_details?.email || undefined,
          metadata,
          errorMessage: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json({ error: "Manual booking update failed" }, { status: 500 });
      }

      return NextResponse.json({ received: true });
    }

    const vehicleId = metadata.vehicleId;
    const date = metadata.date;
    const endDate = metadata.endDate || date;
    const startTime = metadata.startTime;
    const endTime = metadata.endTime;
    const guestCount = Number(metadata.guestCount || 0);
    const customerName = metadata.customerName;
    const customerEmail = metadata.customerEmail || session.customer_details?.email || "";
    const customerPhone = metadata.customerPhone;
    const notes = metadata.notes || null;
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : "";
    const depositAmount = Number(metadata.depositAmount || 0);
    const remainingAmount = Number(metadata.remainingAmount || 0);
    const stripeCustomerId = typeof session.customer === "string" ? session.customer : "";

    if (
      !vehicleId ||
      !date ||
      !startTime ||
      !endTime ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      guestCount <= 0 ||
      !isValidIsoDate(date) ||
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      console.error("Stripe webhook: rejected checkout.session.completed due to missing/invalid metadata", {
        sessionId: session.id,
        paymentIntentId,
        metadata
      });
      await notifyAdminOfWebhookFailure({
        reason: "Missing or invalid required metadata fields",
        sessionId: session.id,
        paymentIntentId,
        customerEmail,
        metadata
      });
      return NextResponse.json({ error: "Missing or invalid metadata" }, { status: 500 });
    }

    const matchedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);

    if (!matchedVehicle) {
      console.error("Stripe webhook: vehicleId from metadata not found in data/vehicles", {
        sessionId: session.id,
        paymentIntentId,
        vehicleId
      });
      await notifyAdminOfWebhookFailure({
        reason: `vehicleId "${vehicleId}" not found in data/vehicles`,
        sessionId: session.id,
        paymentIntentId,
        customerEmail,
        metadata
      });
      return NextResponse.json({ error: "Unknown vehicleId" }, { status: 500 });
    }

    const vehicleResult = await query<VehicleRow>("SELECT id FROM vehicles WHERE slug = $1 LIMIT 1", [matchedVehicle.slug]);
    const dbVehicleId = vehicleResult.rows[0]?.id;

    if (!dbVehicleId) {
      console.error("Stripe webhook: vehicle slug not found in DB vehicles table", {
        sessionId: session.id,
        paymentIntentId,
        slug: matchedVehicle.slug
      });
      await notifyAdminOfWebhookFailure({
        reason: `vehicles row missing for slug "${matchedVehicle.slug}"`,
        sessionId: session.id,
        paymentIntentId,
        customerEmail,
        metadata
      });
      return NextResponse.json({ error: "Vehicle row not found" }, { status: 500 });
    }

    try {
      const bookingInsertResult = await query<InsertedBookingRow>(
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
          VALUES ($1, $2, $3, $4, $5::date, $6::date, $7::time, $8::time, $9, $10, $11, $12, $13, 'pending', $14, $15, $16)
          ON CONFLICT (stripe_session_id) DO NOTHING
          RETURNING id
        `,
        [
          dbVehicleId,
          customerName,
          customerEmail,
          customerPhone,
          date,
          endDate,
          startTime,
          endTime,
          guestCount,
          notes,
          depositAmount + remainingAmount,
          depositAmount,
          remainingAmount,
          session.id,
          paymentIntentId,
          stripeCustomerId
        ]
      );

      const insertedBookingId = bookingInsertResult.rows[0]?.id;

      if (!insertedBookingId) {
        const existingBookingResult = await query<ExistingBookingRow>(
          "SELECT id FROM bookings WHERE stripe_session_id = $1 LIMIT 1",
          [session.id]
        );

        if (!existingBookingResult.rows[0]?.id) {
          const errorMessage = "Booking insert returned no id and no existing stripe_session_id row was found";
          console.error("Stripe webhook: no booking row persisted for completed checkout session", {
            sessionId: session.id,
            paymentIntentId
          });
          await notifyAdminOfWebhookFailure({
            reason: errorMessage,
            sessionId: session.id,
            paymentIntentId,
            customerEmail,
            metadata
          });
          return NextResponse.json({ error: "Booking was not persisted" }, { status: 500 });
        }

        // Duplicate delivery of the same session — the request emails already went out.
        console.log("Stripe webhook: duplicate session handled idempotently", {
          bookingId: existingBookingResult.rows[0].id,
          sessionId: session.id
        });
        return NextResponse.json({ received: true });
      }

      console.log("Stripe webhook: booking request recorded", {
        bookingId: insertedBookingId,
        sessionId: session.id,
        paymentIntentId,
        vehicleId,
        date,
        startTime,
        endTime
      });

      try {
        await sendRequestReceivedEmail({
          customerName,
          customerEmail,
          vehicleName: matchedVehicle.name,
          date,
          startTime,
          endTime,
          depositAmount
        });
      } catch (emailError) {
        console.error("Request-received email failed:", emailError);
      }

      const booking = await getBookingForAction(insertedBookingId);

      if (booking) {
        const token = createBookingActionToken(insertedBookingId);
        const reviewUrl = token ? `${process.env.NEXT_PUBLIC_BASE_URL}/booking-action?token=${token}` : null;
        await sendBookingRequestAlerts(booking, reviewUrl);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const postgresErrorCode = typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

      if (postgresErrorCode === "23P01") {
        // Someone else booked this slot first. The payment is only an auth hold at
        // this point, so release it automatically — the customer is never charged.
        let holdReleased = false;

        if (paymentIntentId) {
          try {
            await stripe.paymentIntents.cancel(paymentIntentId);
            holdReleased = true;
          } catch (cancelError) {
            console.error("Failed to release hold after overlap:", cancelError);
          }
        }

        try {
          await getResend().emails.send({
            from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
            to: customerEmail,
            subject: "Booking Unavailable — ATX Boats and Buses",
            text: holdReleased
              ? `Hi ${customerName}, unfortunately the time you requested for ${matchedVehicle.name} on ${date} was booked by another customer moments before your request. The hold on your card has been released and you will not be charged. We'd love to host you at another time — please check availability and book again. Thank you, ATX Boats and Buses`
              : `Hi ${customerName}, unfortunately the time you requested for ${matchedVehicle.name} on ${date} was booked by another customer moments before your request. We are releasing the hold on your card — if it does not clear within a few business days, please contact us. Thank you, ATX Boats and Buses`
          });
        } catch (emailError) {
          console.error("Overlap notification email failed:", emailError);
        }

        console.error("Stripe webhook: booking overlap — hold " + (holdReleased ? "released" : "release FAILED"), {
          sessionId: session.id,
          paymentIntentId,
          error: errorMessage
        });
        await notifyAdminOfWebhookFailure({
          reason: holdReleased
            ? "Booking overlap: duplicate slot request; the customer's hold was automatically released. No action needed unless they rebook."
            : "Booking overlap AND the hold release failed — cancel the payment intent manually in Stripe.",
          sessionId: session.id,
          paymentIntentId,
          customerEmail,
          metadata,
          errorMessage
        });
        return NextResponse.json({ received: true, overlap: true });
      }

      console.error("Webhook checkout.session.completed error:", {
        sessionId: session.id,
        paymentIntentId,
        error: errorMessage
      });
      await notifyAdminOfWebhookFailure({
        reason: "Booking insert / post-insert step failed",
        sessionId: session.id,
        paymentIntentId,
        customerEmail,
        metadata,
        errorMessage
      });
      return NextResponse.json({ error: "Booking creation failed" }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Stripe checkout.session.expired:", session.id);
  }

  return NextResponse.json({ received: true });
}
