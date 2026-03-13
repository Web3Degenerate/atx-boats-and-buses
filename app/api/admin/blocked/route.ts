import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, validAdminTokens } from "@/lib/admin-auth";

type BlockedRow = {
  id: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
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
    SELECT
      bd.id,
      bd.start_date,
      bd.start_time::text,
      bd.end_date,
      bd.end_time::text,
      bd.reason,
      v.name as vehicle_name,
      v.id as vehicle_id
    FROM blocked_dates bd
    JOIN vehicles v ON v.id = bd.vehicle_id
    ORDER BY bd.start_date DESC, bd.start_time DESC
  `);

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    vehicleId?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    reason?: string;
  };

  if (!body.vehicleId || !body.startDate || !body.startTime || !body.endDate || !body.endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const startValue = `${body.startDate}T${body.startTime}`;
  const endValue = `${body.endDate}T${body.endTime}`;
  if (startValue > endValue) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  await query(
    `
      INSERT INTO blocked_dates (vehicle_id, start_date, start_time, end_date, end_time, reason)
      VALUES ($1, $2::date, $3::time, $4::date, $5::time, $6)
    `,
    [body.vehicleId, body.startDate, body.startTime, body.endDate, body.endTime, body.reason ?? null]
  );

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
