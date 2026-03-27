import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { vehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { getEmailTemplate, renderTemplate } from "@/lib/email-templates";
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
            deposit_amount,
            remaining_amount,
            status,
            stripe_session_id,
            stripe_payment_intent_id,
            stripe_customer_id
          )
          VALUES ($1, $2, $3, $4, $5::date, $6::time, $7::time, $8, $9, $10, $11, $12, 'confirmed', $13, $14, $15)
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
          depositAmount,
          remainingAmount,
          session.id,
          paymentIntentId,
          stripeCustomerId
        ]
      );

      try {
        const template = await getEmailTemplate(
          remainingAmount > 0 ? "booking_confirmed_deposit" : "booking_confirmed_full"
        );
        const customerEmailText = remainingAmount > 0
          ? `Hi ${customerName}, great news! Your booking for ${matchedVehicle.name} on ${date} from ${startTime} to ${endTime} has been approved. Your 20% deposit of ${formatCurrency(depositAmount)} has already been charged. Your remaining balance of ${formatCurrency(remainingAmount)} will be automatically charged to your card on file 2 days before your booking. We look forward to seeing you! Thank you, ATX Boats and Buses`
          : `Hi ${customerName}, great news! Your booking for ${matchedVehicle.name} on ${date} from ${startTime} to ${endTime} has been approved and your payment of ${formatCurrency(depositAmount)} has been processed. We look forward to seeing you! Thank you, ATX Boats and Buses`;

        if (template) {
          const renderedHtml = renderTemplate(template.html_body, {
            customerName,
            vehicleName: matchedVehicle.name,
            date,
            startTime,
            endTime,
            depositAmount: formatCurrency(depositAmount),
            remainingAmount: formatCurrency(remainingAmount),
            totalAmount: formatCurrency(depositAmount + remainingAmount)
          });

          await getResend().emails.send({
            from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
            to: customerEmail,
            subject: template.subject,
            html: renderedHtml
          });
        } else {
          await getResend().emails.send({
            from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
            to: customerEmail,
            subject: "Booking Confirmed — ATX Boats and Buses",
            text: customerEmailText
          });
        }
      } catch (error) {
        console.error("Resend customer confirmation email failed:", error);
      }
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ received: true });
      }

      console.error("Webhook checkout.session.completed error:", error);
      throw error;
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Stripe checkout.session.expired:", session.id);
  }

  return NextResponse.json({ received: true });
}
