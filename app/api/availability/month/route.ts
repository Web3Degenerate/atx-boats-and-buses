import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";
import { vehicles } from "@/data/vehicles";

export async function GET(request: NextRequest) {
  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  const month = request.nextUrl.searchParams.get("month");

  if (!vehicleId || !month) {
    return NextResponse.json({ error: "Missing vehicleId or month" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const vehicle = vehicles.find((entry) => entry.id === vehicleId);
  const minimumHours = vehicle?.minimumHours ?? 3;
  const disabledDates: string[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, monthNum - 1, day);

    if (checkDate < today) {
      continue;
    }

    const availability = await getAvailability(vehicleId, dateStr);

    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const slot of availability.slots) {
      if (slot.isAvailable) {
        currentConsecutive += 1;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    if (maxConsecutive < minimumHours) {
      disabledDates.push(dateStr);
    }
  }

  return NextResponse.json({ disabledDates });
}
