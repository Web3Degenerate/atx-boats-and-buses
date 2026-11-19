import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { query } from "@/lib/db";

const ACTIONS = {
  stop_autocharge: "balance_autocharge_disabled = TRUE",
  resume_autocharge: "balance_autocharge_disabled = FALSE, balance_charge_failed = FALSE",
  mark_paid: "balance_paid = TRUE"
} as const;

type BalanceAction = keyof typeof ACTIONS;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingId, action } = (await request.json()) as { bookingId?: string; action?: string };

  if (!bookingId || !action || !(action in ACTIONS)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await query(
    `UPDATE bookings SET ${ACTIONS[action as BalanceAction]}
     WHERE id = $1 AND status = 'confirmed' AND balance_paid = FALSE`,
    [bookingId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Booking not found or balance already paid" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
