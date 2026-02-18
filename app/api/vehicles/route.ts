import { NextResponse } from "next/server";
import { vehicles as staticVehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import { Vehicle } from "@/types";

export const dynamic = "force-dynamic";

type VehicleRow = {
  id: string;
  name: string;
  slug: string;
  type: Vehicle["type"];
  description: string;
  capacity: number;
  price_per_hour: number;
  minimum_hours: number;
  maximum_hours: number;
  fuel_charge_percent: number;
  features: string[] | string;
  images: string[] | string;
};

function parseJsonArray(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const result = await query<VehicleRow>(
    "SELECT id, name, slug, type, description, capacity, price_per_hour, minimum_hours, maximum_hours, fuel_charge_percent, features, images FROM vehicles ORDER BY name"
  );

  const vehicles: Vehicle[] = result.rows.map((row) => {
    const staticVehicle = staticVehicles.find((v) => v.slug === row.slug);

    return {
      id: staticVehicle?.id || row.slug,
      name: row.name,
      slug: row.slug,
      type: row.type,
      description: row.description,
      capacity: row.capacity,
      pricePerHour: row.price_per_hour / 100,
      minimumHours: row.minimum_hours,
      maximumHours: row.maximum_hours,
      fuelChargePercent: row.fuel_charge_percent,
      features: parseJsonArray(row.features),
      images: parseJsonArray(row.images)
    };
  });

  return NextResponse.json(vehicles);
}
