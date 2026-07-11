import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { createManualBooking, type ManualBookingInput } from "@/lib/manual-booking";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ManualBookingInput>;

  if (
    !body.vehicleSlug ||
    !body.date ||
    !body.startTime ||
    !body.endDate ||
    !body.endTime ||
    !body.guestCount ||
    !body.customerName ||
    !body.customerEmail ||
    !body.totalAmountCents ||
    (body.depositMode !== "full" && body.depositMode !== "deposit")
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await createManualBooking({
    vehicleSlug: body.vehicleSlug,
    date: body.date,
    startTime: body.startTime,
    endDate: body.endDate,
    endTime: body.endTime,
    guestCount: body.guestCount,
    customerName: body.customerName,
    customerEmail: body.customerEmail,
    customerPhone: body.customerPhone,
    notes: body.notes,
    totalAmountCents: body.totalAmountCents,
    depositMode: body.depositMode
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}
