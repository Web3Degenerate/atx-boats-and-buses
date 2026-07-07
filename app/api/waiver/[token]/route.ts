import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

type WaiverLookupRow = {
  waiver_link_id: string;
  booking_id: string;
  token: string;
  vehicle_type: string;
  vehicle_name: string;
  capacity: number;
  guest_count: number;
  trip_date: string;
  template_body: string;
  customer_name: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_status: string;
};

type SignedCountRow = {
  count: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const waiverResult = await query<WaiverLookupRow>(
    `
      SELECT
        wl.id AS waiver_link_id,
        wl.booking_id,
        wl.token,
        wl.vehicle_type,
        v.name AS vehicle_name,
        v.capacity,
        wl.guest_count,
        wl.trip_date,
        wt.body AS template_body,
        b.customer_name,
        b.date,
        b.start_time::text,
        b.end_time::text,
        b.status AS booking_status
      FROM waiver_links wl
      JOIN bookings b ON b.id = wl.booking_id
      JOIN vehicles v ON v.id = b.vehicle_id
      JOIN waiver_templates wt ON wt.vehicle_type = wl.vehicle_type
      WHERE wl.token = $1
      LIMIT 1
    `,
    [params.token]
  );

  const waiver = waiverResult.rows[0];

  if (!waiver) {
    return NextResponse.json({ error: "Waiver link not found" }, { status: 404 });
  }

  const signedCountResult = await query<SignedCountRow>(
    "SELECT COUNT(*)::text AS count FROM signed_waivers WHERE waiver_link_id = $1",
    [waiver.waiver_link_id]
  );

  return NextResponse.json({
    body: waiver.template_body,
    booking: {
      id: waiver.booking_id,
      customerName: waiver.customer_name,
      date: waiver.date,
      startTime: waiver.start_time,
      endTime: waiver.end_time,
      status: waiver.booking_status,
      vehicleType: waiver.vehicle_type,
      vehicleName: waiver.vehicle_name
    },
    guest_count: waiver.guest_count,
    vehicle_capacity: waiver.capacity,
    signed_count: Number(signedCountResult.rows[0]?.count || 0)
  });
}
