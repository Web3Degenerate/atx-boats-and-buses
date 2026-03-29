import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

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
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<BookingRow>(`
    SELECT b.id, b.customer_name, b.customer_email, b.customer_phone, b.date, b.start_time, b.end_time, b.guest_count, b.notes, b.total_price, b.status, b.created_at, v.name as vehicle_name
    FROM bookings b
    JOIN vehicles v ON v.id = b.vehicle_id
    WHERE b.date >= CURRENT_DATE
    ORDER BY b.date ASC, b.start_time ASC
  `);

  return NextResponse.json(result.rows);
}
