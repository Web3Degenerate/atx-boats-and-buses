import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

type PricingRow = {
  id: string;
  name: string;
  slug: string;
  price_per_hour: number;
  minimum_hours: number;
  maximum_hours: number;
  fuel_charge_percent: number;
  optional_charge_label: string;
};

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<PricingRow>(
    "SELECT id, name, slug, price_per_hour, minimum_hours, maximum_hours, fuel_charge_percent, optional_charge_label FROM vehicles ORDER BY name"
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    vehicleId?: string;
    pricePerHour?: number;
    minimumHours?: number;
    maximumHours?: number;
    fuelChargePercent?: number;
    optionalChargeLabel?: string;
  };

  const { vehicleId, pricePerHour, minimumHours, maximumHours, fuelChargePercent, optionalChargeLabel } = body;

  if (
    !vehicleId ||
    pricePerHour === undefined ||
    minimumHours === undefined ||
    maximumHours === undefined ||
    fuelChargePercent === undefined ||
    !optionalChargeLabel?.trim()
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await query(
    "UPDATE vehicles SET price_per_hour = $1, minimum_hours = $2, fuel_charge_percent = $3, maximum_hours = $4, optional_charge_label = $5 WHERE id = $6",
    [pricePerHour, minimumHours, fuelChargePercent, maximumHours, optionalChargeLabel.trim(), vehicleId]
  );

  return NextResponse.json({ success: true });
}
