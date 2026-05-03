import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { vehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { getEmailTemplate, renderTemplate } from "@/lib/email-templates";
import { stripe } from "@/lib/stripe";
import { createWaiverLink } from "@/lib/waiver";

type VehicleRow = {
  id: string;
};

type InsertedBookingRow = {
  id: string;
};

type ExistingBookingRow = {
  id: string;
};

type WaiverLinkRow = {
  token: string;
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

async function sendBookingConfirmationEmail(params: {
  customerName: string;
  customerEmail: string;
  vehicleName: string;
  date: string;
  startTime: string;
  endTime: string;
  depositAmount: number;
  remainingAmount: number;
  waiverLink: string;
}): Promise<void> {
  const template = await getEmailTemplate(
    params.remainingAmount > 0 ? "booking_confirmed_deposit" : "booking_confirmed_full"
  );
  const customerEmailText = params.remainingAmount > 0
    ? `Hi ${params.customerName}, great news! Your booking for ${params.vehicleName} on ${params.date} from ${params.startTime} to ${params.endTime} has been approved. Your 20% deposit of ${formatCurrency(params.depositAmount)} has already been charged. Your remaining balance of ${formatCurrency(params.remainingAmount)} will be automatically charged to your card on file 2 days before your booking. We look forward to seeing you! Thank you, ATX Boats and Buses`
    : `Hi ${params.customerName}, great news! Your booking for ${params.vehicleName} on ${params.date} from ${params.startTime} to ${params.endTime} has been approved and your payment of ${formatCurrency(params.depositAmount)} has been processed. We look forward to seeing you! Thank you, ATX Boats and Buses`;

  if (template) {
    const renderedHtml = renderTemplate(template.html_body, {
      customerName: params.customerName,
      vehicleName: params.vehicleName,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      depositAmount: formatCurrency(params.depositAmount),
      remainingAmount: formatCurrency(params.remainingAmount),
      totalAmount: formatCurrency(params.depositAmount + params.remainingAmount)
    });

    const confirmationHtml = `${renderedHtml}<p style="margin-top:16px;">Complete your waiver here: <a href="${params.waiverLink}">${params.waiverLink}</a></p>`;

    await getResend().emails.send({
      from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
      to: params.customerEmail,
      subject: template.subject,
      html: confirmationHtml
    });
    return;
  }

  await getResend().emails.send({
    from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
    to: params.customerEmail,
    subject: "Booking Confirmed — ATX Boats and Buses",
    text: `${customerEmailText}\n\nComplete your waiver here: ${params.waiverLink}`
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
      let bookingId: string;
      let bookingCreated = false;

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
          VALUES ($1, $2, $3, $4, $5::date, $6::date, $7::time, $8::time, $9, $10, $11, $12, $13, 'confirmed', $14, $15, $16)
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
          session.amount_total ?? 0,
          depositAmount,
          remainingAmount,
          session.id,
          paymentIntentId,
          stripeCustomerId
        ]
      );

      const insertedBookingId = bookingInsertResult.rows[0]?.id;
      if (insertedBookingId) {
        bookingId = insertedBookingId;
        bookingCreated = true;
        console.log("Stripe webhook: booking created", {
          bookingId,
          sessionId: session.id,
          paymentIntentId,
          vehicleId,
          date,
          startTime,
          endTime
        });
      } else {
        const existingBookingResult = await query<ExistingBookingRow>(
          "SELECT id FROM bookings WHERE stripe_session_id = $1 LIMIT 1",
          [session.id]
        );
        const existingBookingId = existingBookingResult.rows[0]?.id;

        if (!existingBookingId) {
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

        bookingId = existingBookingId;
        console.log("Stripe webhook: duplicate session loaded existing booking", {
          bookingId,
          sessionId: session.id,
          paymentIntentId
        });
      }

      if (!bookingId) {
        throw new Error("Booking insert did not return an id");
      }

      const existingWaiverResult = await query<WaiverLinkRow>(
        "SELECT token FROM waiver_links WHERE booking_id = $1 LIMIT 1",
        [bookingId]
      );

      if (existingWaiverResult.rows[0]?.token) {
        console.log("Stripe webhook: downstream waiver/email work already completed", {
          bookingId,
          sessionId: session.id,
          bookingCreated
        });
        return NextResponse.json({ received: true });
      }

      const waiverLink = await createWaiverLink(bookingId, matchedVehicle.type, guestCount, date);
      await sendBookingConfirmationEmail({
        customerName,
        customerEmail,
        vehicleName: matchedVehicle.name,
        date,
        startTime,
        endTime,
        depositAmount,
        remainingAmount,
        waiverLink
      });

      if (!bookingCreated) {
        console.log("Stripe webhook: duplicate session handled idempotently", {
          bookingId,
          sessionId: session.id,
          downstreamCompleted: false
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const postgresErrorCode = typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;

      if (postgresErrorCode === "23P01") {
        console.error("Stripe webhook: booking overlap exclusion constraint violation after payment capture", {
          sessionId: session.id,
          paymentIntentId,
          error: errorMessage
        });
        await notifyAdminOfWebhookFailure({
          reason: "Booking overlap exclusion constraint violation after payment capture",
          sessionId: session.id,
          paymentIntentId,
          customerEmail,
          metadata,
          errorMessage
        });
        return NextResponse.json({ error: "Booking overlap detected after payment capture" }, { status: 500 });
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
