import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isWaiverAdminAuthorized } from "@/lib/admin-auth";

type WaiverAdminRow = {
  booking_id: string;
  vehicle_name: string;
  customer_name: string;
  customer_email: string;
  trip_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  waiver_token: string | null;
  signed_waiver_id: string | null;
  signer_type: "adult" | "guardian" | null;
  first_name: string | null;
  last_name: string | null;
  signer_email: string | null;
  signed_at: string | null;
  minor_first_name: string | null;
  minor_last_name: string | null;
};

type SignerResponse = {
  id: string;
  signer_type: "adult" | "guardian";
  first_name: string;
  last_name: string;
  email: string;
  signed_at: string;
  minors: Array<{
    first_name: string;
    last_name: string;
  }>;
};

type BookingResponse = {
  id: string;
  vehicle_name: string;
  customer_name: string;
  customer_email: string;
  trip_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  waiver_token: string | null;
  signers: SignerResponse[];
};

export async function GET(request: NextRequest) {
  if (!(await isWaiverAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<WaiverAdminRow>(
    `
      SELECT
        b.id AS booking_id,
        v.name AS vehicle_name,
        b.customer_name,
        b.customer_email,
        b.date::text AS trip_date,
        b.start_time::text,
        b.end_time::text,
        COALESCE(wl.guest_count, b.guest_count) AS guest_count,
        wl.token AS waiver_token,
        sw.id AS signed_waiver_id,
        sw.signer_type,
        sw.first_name,
        sw.last_name,
        sw.email AS signer_email,
        sw.signed_at::text,
        wm.first_name AS minor_first_name,
        wm.last_name AS minor_last_name
      FROM bookings b
      JOIN vehicles v ON v.id = b.vehicle_id
      LEFT JOIN waiver_links wl ON wl.booking_id = b.id
      LEFT JOIN signed_waivers sw ON sw.waiver_link_id = wl.id
      LEFT JOIN waiver_minors wm ON wm.signed_waiver_id = sw.id
      WHERE b.date >= CURRENT_DATE
        AND b.status = 'confirmed'
      ORDER BY b.date ASC, b.start_time ASC, sw.signed_at ASC NULLS LAST, wm.last_name ASC NULLS LAST, wm.first_name ASC NULLS LAST
    `
  );

  const bookings = new Map<string, BookingResponse>();
  const signerKeys = new Set<string>();

  for (const row of result.rows) {
    if (!bookings.has(row.booking_id)) {
      bookings.set(row.booking_id, {
        id: row.booking_id,
        vehicle_name: row.vehicle_name,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        trip_date: row.trip_date,
        start_time: row.start_time,
        end_time: row.end_time,
        guest_count: row.guest_count,
        waiver_token: row.waiver_token,
        signers: []
      });
    }

    if (!row.signed_waiver_id || !row.signer_type || !row.first_name || !row.last_name || !row.signer_email || !row.signed_at) {
      continue;
    }

    const booking = bookings.get(row.booking_id)!;
    const signerMapKey = `${row.booking_id}:${row.signed_waiver_id}`;

    if (!signerKeys.has(signerMapKey)) {
      booking.signers.push({
        id: row.signed_waiver_id,
        signer_type: row.signer_type,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.signer_email,
        signed_at: row.signed_at,
        minors: []
      });
      signerKeys.add(signerMapKey);
    }

    if (row.minor_first_name && row.minor_last_name) {
      const signer = booking.signers.find((item) => item.id === row.signed_waiver_id);
      if (signer && !signer.minors.some((minor) => minor.first_name === row.minor_first_name && minor.last_name === row.minor_last_name)) {
        signer.minors.push({
          first_name: row.minor_first_name,
          last_name: row.minor_last_name
        });
      }
    }
  }

  return NextResponse.json(Array.from(bookings.values()));
}
