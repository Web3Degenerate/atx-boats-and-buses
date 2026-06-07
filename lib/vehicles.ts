import { vehicles as staticVehicles } from "@/data/vehicles";
import { query } from "@/lib/db";
import type { Vehicle } from "@/types";

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
  optional_charge_label: string;
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

export function mapVehicleRow(row: VehicleRow): Vehicle {
  const staticVehicle = staticVehicles.find((vehicle) => vehicle.slug === row.slug);

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
    optionalChargeLabel: row.optional_charge_label || staticVehicle?.optionalChargeLabel || "Fuel Charge",
    features: parseJsonArray(row.features),
    images: parseJsonArray(row.images)
  };
}

export async function getVehicles(): Promise<Vehicle[]> {
  const result = await query<VehicleRow>(
    "SELECT id, name, slug, type, description, capacity, price_per_hour, minimum_hours, maximum_hours, fuel_charge_percent, optional_charge_label, features, images FROM vehicles ORDER BY name"
  );

  return result.rows.map(mapVehicleRow);
}

export async function getVehicleBySlug(slug: string): Promise<(Vehicle & { dbId: string }) | null> {
  const result = await query<VehicleRow>(
    `
      SELECT id, name, slug, type, description, capacity, price_per_hour, minimum_hours, maximum_hours, fuel_charge_percent, optional_charge_label, features, images
      FROM vehicles
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  );
  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    ...mapVehicleRow(row),
    dbId: row.id
  };
}
