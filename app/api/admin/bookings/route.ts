import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, validAdminTokens } from "@/lib/admin-auth";

type BookingRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  notes: string | null;
  total_price: number;
  status: string;
  created_at: string;
  vehicle_name: string;
};

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token || !validAdminTokens.has(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<BookingRow>(`
    SELECT b.id, b.customer_name, b.customer_email, b.customer_phone, b.date, b.start_time, b.end_time, b.guest_count, b.notes, b.total_price, b.status, b.created_at, v.name as vehicle_name
    FROM bookings b
    JOIN vehicles v ON v.id = b.vehicle_id
    ORDER BY b.date DESC, b.start_time DESC
  `);

  return NextResponse.json(result.rows);
}
