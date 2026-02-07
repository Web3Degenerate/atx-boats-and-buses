import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  const date = request.nextUrl.searchParams.get("date");

  if (!vehicleId || !date) {
    return NextResponse.json(
      { error: "Missing required query params: vehicleId and date" },
      { status: 400 }
    );
  }

  try {
    const availability = await getAvailability(vehicleId, date);
    return NextResponse.json(availability);
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
