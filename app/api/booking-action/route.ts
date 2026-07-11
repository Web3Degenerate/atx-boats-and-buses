import { NextRequest, NextResponse } from "next/server";
import { approveBooking, rejectBooking } from "@/lib/booking-actions";
import { verifyBookingActionToken } from "@/lib/booking-approval";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (isRateLimited(`booking-action:${getClientIp(request)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const formData = await request.formData();
  const token = String(formData.get("token") || "");
  const action = String(formData.get("action") || "");

  const bookingId = token ? verifyBookingActionToken(token) : null;

  if (!bookingId) {
    return NextResponse.redirect(
      new URL(`/booking-action?error=${encodeURIComponent("This link is invalid or has expired.")}`, request.url),
      303
    );
  }

  if (action !== "approve" && action !== "decline") {
    return NextResponse.redirect(
      new URL(`/booking-action?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Unknown action.")}`, request.url),
      303
    );
  }

  const result = action === "approve" ? await approveBooking(bookingId) : await rejectBooking(bookingId);

  const params = new URLSearchParams({ token });

  if (result.ok) {
    params.set("result", action === "approve" ? "approved" : "declined");
  } else {
    params.set("error", result.error);
  }

  return NextResponse.redirect(new URL(`/booking-action?${params.toString()}`, request.url), 303);
}
