import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { query } from "@/lib/db";
import { getResend } from "@/lib/resend";
import { getBearerToken, validAdminTokens } from "@/lib/admin-auth";

type BookingRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  stripe_payment_intent_id: string | null;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  total_price: number;
  vehicle_name: string;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export async function POST(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token || !validAdminTokens.has(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = (await request.json()) as { bookingId?: string };

  if (!bookingId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const bookingResult = await query<BookingRow>(
    `
      SELECT b.id, b.customer_name, b.customer_email, b.stripe_payment_intent_id, b.status, b.date, b.start_time, b.end_time, b.guest_count, b.total_price, v.name as vehicle_name
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.id = $1
    `,
    [bookingId]
  );

  const booking = bookingResult.rows[0];

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "pending_approval") {
    return NextResponse.json({ error: "Booking is not pending approval" }, { status: 400 });
  }

  try {
    await stripe.paymentIntents.capture(booking.stripe_payment_intent_id || "");
  } catch (error) {
    console.error("Stripe capture failed:", error);
    return NextResponse.json({ error: "Failed to capture payment" }, { status: 500 });
  }

  await query("UPDATE bookings SET status = 'confirmed' WHERE id = $1", [booking.id]);

  try {
    await getResend().emails.send({
      from: "ATX Boats and Buses <bookings@atxboatsandbuses.com>",
      to: booking.customer_email,
      subject: "Booking Confirmed — ATX Boats and Buses",
      text: `Hi ${booking.customer_name}, great news! Your booking for ${booking.vehicle_name} on ${booking.date} from ${booking.start_time} to ${booking.end_time} has been approved and your payment of ${formatCurrency(booking.total_price)} has been processed. We look forward to seeing you! Thank you, ATX Boats and Buses`
    });
  } catch (error) {
    console.error("Resend approval confirmation email failed:", error);
  }

  return NextResponse.json({ success: true });
}
