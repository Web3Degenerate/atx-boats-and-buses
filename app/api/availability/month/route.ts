import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { vehicles } from "@/data/vehicles";

export const dynamic = "force-dynamic";

const TURNOVER_BUFFER_MINUTES = 120;

type DateTimeRangeRow = {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
};

function toMinutes(timeValue: string): number {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return hours * 60 + minutes;
}

function getRangeForDate(range: DateTimeRangeRow, date: string): { start: number; end: number } | null {
  if (date < range.start_date || date > range.end_date) {
    return null;
  }

  const start = range.start_date === date ? toMinutes(range.start_time) : 0;
  const end = range.end_date === date ? toMinutes(range.end_time) : 24 * 60;

  return { start, end };
}

export async function GET(request: NextRequest) {
  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  const month = request.nextUrl.searchParams.get("month");

  if (!vehicleId || !month) {
    return NextResponse.json({ error: "Missing vehicleId or month" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const vehicle = vehicles.find((entry) => entry.id === vehicleId);
  if (!vehicle) {
    return NextResponse.json({ disabledDates: [] });
  }

  const minimumHours = vehicle.minimumHours ?? 3;
  const firstDay = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const lastDay = `${year}-${String(monthNum).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // Resolve short vehicle ID to DB UUID
  const vehicleResult = await query<{ id: string }>(
    "SELECT id FROM vehicles WHERE slug = $1 LIMIT 1",
    [vehicle.slug]
  );
  const dbVehicleId = vehicleResult.rows[0]?.id;
  if (!dbVehicleId) {
    return NextResponse.json({ disabledDates: [] });
  }

  // Two queries total instead of ~30 per month
  const [blockedResult, bookingsResult] = await Promise.all([
    query<DateTimeRangeRow>(
      `SELECT start_date::text, start_time::text, end_date::text, end_time::text
       FROM blocked_dates
       WHERE vehicle_id = $1
         AND start_date <= $2::date
         AND end_date >= $3::date`,
      [dbVehicleId, lastDay, firstDay]
    ),
    query<DateTimeRangeRow>(
      `SELECT date::text AS start_date, end_date::text, start_time::text, end_time::text
       FROM bookings
       WHERE vehicle_id = $1
         AND date <= $3::date
         AND end_date >= $2::date
         AND status IN ('pending', 'confirmed')`,
      [dbVehicleId, firstDay, lastDay]
    ),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const disabledDates: string[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const checkDate = new Date(year, monthNum - 1, day);
    if (checkDate < today) continue;

    // Build availability for 9AM-9PM slots (hours 9-20)
    const slotAvailable = new Array(12).fill(true); // 12 slots: 9,10,11,...,20

    // Mark slots blocked by blocked_dates ranges
    for (const range of blockedResult.rows) {
      const blockedRange = getRangeForDate(range, dateStr);
      if (!blockedRange) continue;

      for (let i = 0; i < 12; i++) {
        const slotStart = (9 + i) * 60;
        const slotEnd = (10 + i) * 60;
        if (slotStart < blockedRange.end && slotEnd > blockedRange.start) {
          slotAvailable[i] = false;
        }
      }
    }

    // Mark slots blocked by existing bookings
    for (const booking of bookingsResult.rows) {
      const bookingRange = getRangeForDate(booking, dateStr);
      if (!bookingRange) continue;

      for (let i = 0; i < 12; i++) {
        const slotStart = (9 + i) * 60;
        const slotEnd = (10 + i) * 60;
        // Turnover applies only after the booking's real end, not on full intermediate days.
        const bookingEnd = booking.end_date === dateStr
          ? bookingRange.end + TURNOVER_BUFFER_MINUTES
          : bookingRange.end;
        if (slotStart < bookingEnd && slotEnd > bookingRange.start) {
          slotAvailable[i] = false;
        }
      }
    }

    // Check max consecutive available slots
    let maxConsecutive = 0;
    let current = 0;
    for (let i = 0; i < 12; i++) {
      if (slotAvailable[i]) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }

    if (maxConsecutive < minimumHours) {
      disabledDates.push(dateStr);
    }
  }

  return NextResponse.json({ disabledDates });
}
