import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getResend } from "@/lib/resend";

export const dynamic = "force-dynamic";

type ReminderBookingRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  remaining_amount: number;
  date: string;
  vehicle_name: string;
};

type ChargeBookingRow = ReminderBookingRow & {
  stripe_payment_intent_id: string;
  stripe_customer_id: string;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

async function sendEmailSafely(options: { to: string; subject: string; text: string }) {
  try {
    await getResend().emails.send({
      from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
      to: options.to,
      subject: options.subject,
      text: options.text
    });
  } catch (error) {
    console.error(`Email send failed for ${options.subject}:`, error);
  }
}

async function markChargeFailed(bookingId: string) {
  await query("UPDATE bookings SET balance_charge_failed = TRUE WHERE id = $1", [bookingId]);
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let reminders = 0;
  let charged = 0;
  let failed = 0;

  const reminderResult = await query<ReminderBookingRow>(
    `
      SELECT b.id, b.customer_name, b.customer_email, b.remaining_amount, b.date, v.name as vehicle_name
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.status = 'confirmed'
        AND b.balance_paid = FALSE
        AND b.remaining_amount > 0
        AND b.balance_charge_failed = FALSE
        AND b.date = CURRENT_DATE + INTERVAL '3 days'
    `
  );

  for (const booking of reminderResult.rows) {
    await sendEmailSafely({
      to: booking.customer_email,
      subject: "Reminder: Balance payment coming up — ATX Boats and Buses",
      text: `Hi ${booking.customer_name}, this is a reminder that your remaining balance of ${formatCurrency(booking.remaining_amount)} for ${booking.vehicle_name} on ${booking.date} will be automatically charged to your card on file tomorrow. Thank you, ATX Boats and Buses`
    });
    reminders += 1;
  }

  const chargeResult = await query<ChargeBookingRow>(
    `
      SELECT b.id, b.customer_name, b.customer_email, b.remaining_amount, b.date, b.stripe_payment_intent_id, b.stripe_customer_id, v.name as vehicle_name
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.status = 'confirmed'
        AND b.balance_paid = FALSE
        AND b.remaining_amount > 0
        AND b.balance_charge_failed = FALSE
        AND b.date = CURRENT_DATE + INTERVAL '2 days'
    `
  );

  for (const booking of chargeResult.rows) {
    try {
      const pi = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
      const paymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : null;

      if (!paymentMethodId) {
        await markChargeFailed(booking.id);
        failed += 1;

        await sendEmailSafely({
          to: "bookings@atxboatsandbuses.com",
          subject: `Action required: Balance charge failed — ${booking.vehicle_name} on ${booking.date}`,
          text: `Balance charge failed for ${booking.customer_name} booking on ${booking.date} for ${booking.vehicle_name}. Amount: ${formatCurrency(booking.remaining_amount)}. Please contact the customer and handle manually.`
        });
        await sendEmailSafely({
          to: booking.customer_email,
          subject: "Action needed: Payment failed — ATX Boats and Buses",
          text: `Hi ${booking.customer_name}, we were unable to charge your remaining balance of ${formatCurrency(booking.remaining_amount)} for ${booking.vehicle_name} on ${booking.date}. Please contact us as soon as possible to update your payment information. Thank you, ATX Boats and Buses`
        });
        continue;
      }

      const newPi = await stripe.paymentIntents.create({
        amount: booking.remaining_amount,
        currency: "usd",
        customer: booking.stripe_customer_id,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true
      });

      await query(
        "UPDATE bookings SET balance_paid = TRUE, balance_payment_intent_id = $1 WHERE id = $2",
        [newPi.id, booking.id]
      );

      charged += 1;

      await sendEmailSafely({
        to: booking.customer_email,
        subject: "Balance charged — ATX Boats and Buses",
        text: `Hi ${booking.customer_name}, your remaining balance of ${formatCurrency(booking.remaining_amount)} for ${booking.vehicle_name} on ${booking.date} has been successfully charged. Your booking is fully paid and confirmed. We look forward to seeing you! Thank you, ATX Boats and Buses`
      });
    } catch (error) {
      console.error("Balance charge failed:", error);
      await markChargeFailed(booking.id);
      failed += 1;

      await sendEmailSafely({
        to: "bookings@atxboatsandbuses.com",
        subject: `Action required: Balance charge failed — ${booking.vehicle_name} on ${booking.date}`,
        text: `Balance charge failed for ${booking.customer_name} booking on ${booking.date} for ${booking.vehicle_name}. Amount: ${formatCurrency(booking.remaining_amount)}. Please contact the customer and handle manually.`
      });
      await sendEmailSafely({
        to: booking.customer_email,
        subject: "Action needed: Payment failed — ATX Boats and Buses",
        text: `Hi ${booking.customer_name}, we were unable to charge your remaining balance of ${formatCurrency(booking.remaining_amount)} for ${booking.vehicle_name} on ${booking.date}. Please contact us as soon as possible to update your payment information. Thank you, ATX Boats and Buses`
      });
    }
  }

  return NextResponse.json({ success: true, reminders, charged, failed });
}
