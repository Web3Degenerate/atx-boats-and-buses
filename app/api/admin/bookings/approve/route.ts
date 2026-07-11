import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { approveBooking } from "@/lib/booking-actions";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId } = (await request.json()) as { bookingId?: string };

  if (!bookingId) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const result = await approveBooking(bookingId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
