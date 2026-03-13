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

type BlockedRangeRow = {
  start_date: string;
  start_time: string;
  end_date: string;
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

function getBlockedRangeForDate(blockedRange: BlockedRangeRow, date: string): { start: number; end: number } | null {
  if (date < blockedRange.start_date || date > blockedRange.end_date) {
    return null;
  }

  const start = blockedRange.start_date === date ? toMinutes(blockedRange.start_time) : 0;
  const end = blockedRange.end_date === date ? toMinutes(blockedRange.end_time) : 24 * 60;

  return { start, end };
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

  const blockedRangesResult = await query<BlockedRangeRow>(
    `
      SELECT start_date, start_time::text, end_date, end_time::text
      FROM blocked_dates
      WHERE vehicle_id = $1
        AND start_date <= $2::date
        AND end_date >= $2::date
    `,
    [dbVehicleId, date]
  );

  const slots = generateSlots().map((slot) => ({
    ...slot,
    date
  }));

  const bookings = bookingsResult.rows.map((row: BookingRow) => ({
    start: toMinutes(row.start_time),
    end: toMinutes(row.end_time)
  }));

  const blockedRanges = blockedRangesResult.rows
    .map((range) => getBlockedRangeForDate(range, date))
    .filter((range): range is { start: number; end: number } => Boolean(range));

  const availabilitySlots = slots.map((slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);

    const overlapsBooking = bookings.some(
      (booking: { start: number; end: number }) => slotStart < booking.end && slotEnd > booking.start
    );
    const overlapsBlockedRange = blockedRanges.some((blockedRange) => slotStart < blockedRange.end && slotEnd > blockedRange.start);

    return {
      ...slot,
      isAvailable: !overlapsBooking && !overlapsBlockedRange,
      isBlockedByRange: overlapsBlockedRange
    };
  });

  return {
    vehicleId,
    date,
    isBlocked: availabilitySlots.length > 0 && availabilitySlots.every((slot) => slot.isBlockedByRange),
    slots: availabilitySlots.map(({ isBlockedByRange, ...slot }) => slot)
  };
}
