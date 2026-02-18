import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { vehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";

type VehicleRow = {
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
      return NextResponse.json({ received: true });
    }

    const matchedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);

    if (!matchedVehicle) {
      return NextResponse.json({ received: true });
    }

    const vehicleResult = await query<VehicleRow>("SELECT id FROM vehicles WHERE slug = $1 LIMIT 1", [matchedVehicle.slug]);
    const dbVehicleId = vehicleResult.rows[0]?.id;

    if (!dbVehicleId) {
      return NextResponse.json({ received: true });
    }

    try {
      await query(
        `
          INSERT INTO bookings (
            vehicle_id,
            customer_name,
            customer_email,
            customer_phone,
            date,
            start_time,
            end_time,
            guest_count,
            notes,
            total_price,
            status,
            stripe_session_id,
            stripe_payment_intent_id
          )
          VALUES ($1, $2, $3, $4, $5::date, $6::time, $7::time, $8, $9, $10, 'pending_approval', $11, $12)
        `,
        [
          dbVehicleId,
          customerName,
          customerEmail,
          customerPhone,
          date,
          startTime,
          endTime,
          guestCount,
          notes,
          session.amount_total ?? 0,
          session.id,
          paymentIntentId
        ]
      );

      try {
        await getResend().emails.send({
          from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
          to: customerEmail,
          subject: "Booking Request Received — ATX Boats and Buses",
          text: `Hi ${customerName}, thank you for your booking request for ${matchedVehicle.name} from ${date} ${startTime} to ${endDate} ${endTime}. Your payment is on hold and will only be charged once our team reviews and approves your booking. You will receive a confirmation email once approved. If not approved within 7 days, the hold on your payment will be automatically released. Thank you, ATX Boats and Buses`
        });
      } catch (error) {
        console.error("Resend customer booking request email failed:", error);
      }

      try {
        await getResend().emails.send({
          from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
          to: "bookings@atxboatsandbuses.com", // TODO: Replace with real manager email
          subject: `New Booking Request — ${matchedVehicle.name} on ${date}`,
          text: [
            "New booking request details:",
            "",
            `Vehicle: ${matchedVehicle.name}`,
            `Date: ${endDate !== date ? `${date} to ${endDate}` : date}`,
            `Time: ${startTime} - ${endTime}`,
            `Guest count: ${guestCount}`,
            `Customer name: ${customerName}`,
            `Customer email: ${customerEmail}`,
            `Customer phone: ${customerPhone}`,
            `Notes: ${notes || "None"}`,
            `Total amount: ${formatCurrency(session.amount_total ?? 0)}`,
            "",
            "Log in to the admin panel to approve or reject this booking."
          ].join("\n")
        });
      } catch (error) {
        console.error("Resend manager booking request email failed:", error);
      }
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ received: true });
      }

      throw error;
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Stripe checkout.session.expired:", session.id);
  }

  return NextResponse.json({ received: true });
}
