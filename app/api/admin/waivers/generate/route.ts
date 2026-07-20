import { NextRequest, NextResponse } from "next/server";
import { isWaiverAdminAuthorized } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { createWaiverLink } from "@/lib/waiver";

type BookingRow = {
  id: string;
  status: string;
  date: string;
  guest_count: number;
  vehicle_type: string;
  waiver_token: string | null;
};

export async function POST(request: NextRequest) {
  if (!(await isWaiverAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = (await request.json()) as { bookingId?: string };

  if (!bookingId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const result = await query<BookingRow>(
    `
      SELECT b.id, b.status, b.date::text AS date, b.guest_count, v.type AS vehicle_type, wl.token AS waiver_token
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      LEFT JOIN waiver_links wl ON wl.booking_id = b.id
      WHERE b.id = $1
      LIMIT 1
    `,
    [bookingId]
  );

  const booking = result.rows[0];

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.waiver_token) {
    return NextResponse.json({ error: "This booking already has a waiver link." }, { status: 400 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: `Booking is ${booking.status} — waiver links are only for confirmed bookings.` }, { status: 400 });
  }

  await createWaiverLink(booking.id, booking.vehicle_type, booking.guest_count, booking.date);

  return NextResponse.json({ success: true });
}
