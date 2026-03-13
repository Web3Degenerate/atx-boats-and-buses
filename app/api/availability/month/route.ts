import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { vehicles } from "@/data/vehicles";

export const dynamic = "force-dynamic";

function toMinutes(timeValue: string): number {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return hours * 60 + minutes;
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
    query<{ start_date: string; start_time: string; end_date: string; end_time: string }>(
      `SELECT start_date, start_time::text, end_date, end_time::text
       FROM blocked_dates
       WHERE vehicle_id = $1
         AND start_date <= $2::date
         AND end_date >= $3::date`,
      [dbVehicleId, lastDay, firstDay]
    ),
    query<{ date: string; start_time: string; end_time: string }>(
      `SELECT date, start_time::text, end_time::text
       FROM bookings
       WHERE vehicle_id = $1
         AND date >= $2::date
         AND date <= $3::date
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
      if (dateStr < range.start_date || dateStr > range.end_date) continue;

      const blockStart = range.start_date === dateStr ? toMinutes(range.start_time) : 0;
      const blockEnd = range.end_date === dateStr ? toMinutes(range.end_time) : 24 * 60;

      for (let i = 0; i < 12; i++) {
        const slotStart = (9 + i) * 60;
        const slotEnd = (10 + i) * 60;
        if (slotStart < blockEnd && slotEnd > blockStart) {
          slotAvailable[i] = false;
        }
      }
    }

    // Mark slots blocked by existing bookings
    for (const booking of bookingsResult.rows) {
      if (booking.date !== dateStr) continue;
      const bookStart = toMinutes(booking.start_time);
      const bookEnd = toMinutes(booking.end_time);

      for (let i = 0; i < 12; i++) {
        const slotStart = (9 + i) * 60;
        const slotEnd = (10 + i) * 60;
        if (slotStart < bookEnd && slotEnd > bookStart) {
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
