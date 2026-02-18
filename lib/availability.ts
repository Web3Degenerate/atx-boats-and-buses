import { TimeSlot } from "@/types";
import { query } from "@/lib/db";
import { vehicles } from "@/data/vehicles";

type BookingTimeRow = {
  start_time: string;
  end_time: string;
};

type BookingRow = {
  start_time: string;
  end_time: string;
};

type AvailabilityResult = {
  vehicleId: string;
  date: string;
  isBlocked: boolean;
  slots: TimeSlot[];
};

function toMinutes(timeValue: string): number {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function generateSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let hour = 9; hour < 21; hour += 1) {
    slots.push({
      date: "",
      startTime: formatTime(hour),
      endTime: formatTime(hour + 1),
      isAvailable: true
    });
  }

  return slots;
}

export async function getAvailability(vehicleId: string, date: string): Promise<AvailabilityResult> {
  const matchedVehicle = vehicles.find((v) => v.id === vehicleId);
  if (!matchedVehicle) {
    return { vehicleId, date, isBlocked: false, slots: generateSlots().map((s) => ({ ...s, date })) };
  }

  const vehicleResult = await query<{ id: string }>(
    "SELECT id FROM vehicles WHERE slug = $1 LIMIT 1",
    [matchedVehicle.slug]
  );
  const dbVehicleId = vehicleResult.rows[0]?.id;
  if (!dbVehicleId) {
    return { vehicleId, date, isBlocked: false, slots: generateSlots().map((s) => ({ ...s, date })) };
  }

  const blockedResult = await query<{ exists: boolean }>(
    `
      SELECT EXISTS(
        SELECT 1
        FROM blocked_dates
        WHERE vehicle_id = $1 AND date = $2::date
      ) AS exists
    `,
    [dbVehicleId, date]
  );

  const isBlocked = blockedResult.rows[0]?.exists ?? false;

  const slots = generateSlots().map((slot) => ({
    ...slot,
    date
  }));

  if (isBlocked) {
    return {
      vehicleId,
      date,
      isBlocked: true,
      slots: slots.map((slot) => ({ ...slot, isAvailable: false }))
    };
  }

  const bookingsResult = await query<BookingTimeRow>(
    `
      SELECT start_time::text, end_time::text
      FROM bookings
      WHERE vehicle_id = $1
        AND date = $2::date
        AND status IN ('pending', 'confirmed')
    `,
    [dbVehicleId, date]
  );

  const bookings = bookingsResult.rows.map((row: BookingRow) => ({
    start: toMinutes(row.start_time),
    end: toMinutes(row.end_time)
  }));

  const availabilitySlots = slots.map((slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);

    const overlaps = bookings.some((booking: { start: number; end: number }) => slotStart < booking.end && slotEnd > booking.start);

    return {
      ...slot,
      isAvailable: !overlaps
    };
  });

  return {
    vehicleId,
    date,
    isBlocked: false,
    slots: availabilitySlots
  };
}
