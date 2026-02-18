import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, validAdminTokens } from "@/lib/admin-auth";

type PricingRow = {
  id: string;
  name: string;
  slug: string;
  price_per_hour: number;
  minimum_hours: number;
  maximum_hours: number;
  fuel_charge_percent: number;
};

function isAuthorized(request: NextRequest): boolean {
  const token = getBearerToken(request);
  return Boolean(token && validAdminTokens.has(token));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<PricingRow>(
    "SELECT id, name, slug, price_per_hour, minimum_hours, maximum_hours, fuel_charge_percent FROM vehicles ORDER BY name"
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    vehicleId?: string;
    pricePerHour?: number;
    minimumHours?: number;
    maximumHours?: number;
    fuelChargePercent?: number;
  };

  const { vehicleId, pricePerHour, minimumHours, maximumHours, fuelChargePercent } = body;

  if (
    !vehicleId ||
    pricePerHour === undefined ||
    minimumHours === undefined ||
    maximumHours === undefined ||
    fuelChargePercent === undefined
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await query(
    "UPDATE vehicles SET price_per_hour = $1, minimum_hours = $2, fuel_charge_percent = $3, maximum_hours = $4 WHERE id = $5",
    [pricePerHour, minimumHours, fuelChargePercent, maximumHours, vehicleId]
  );

  return NextResponse.json({ success: true });
}
