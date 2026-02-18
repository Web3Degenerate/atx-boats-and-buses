import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, validAdminTokens } from "@/lib/admin-auth";

type BlockedRow = {
  id: string;
  date: string;
  reason: string | null;
  vehicle_name: string;
  vehicle_id: string;
};

function isAuthorized(request: NextRequest): boolean {
  const token = getBearerToken(request);
  return Boolean(token && validAdminTokens.has(token));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<BlockedRow>(`
    SELECT bd.id, bd.date, bd.reason, v.name as vehicle_name, v.id as vehicle_id
    FROM blocked_dates bd
    JOIN vehicles v ON v.id = bd.vehicle_id
    ORDER BY bd.date DESC
  `);

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { vehicleId?: string; date?: string; reason?: string };

  if (!body.vehicleId || !body.date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await query("INSERT INTO blocked_dates (vehicle_id, date, reason) VALUES ($1, $2::date, $3)", [
    body.vehicleId,
    body.date,
    body.reason ?? null
  ]);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string };

  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await query("DELETE FROM blocked_dates WHERE id = $1", [body.id]);

  return NextResponse.json({ success: true });
}
