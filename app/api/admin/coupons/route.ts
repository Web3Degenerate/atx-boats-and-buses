import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { vehicles as staticVehicles } from "@/data/vehicles";

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
  active: boolean;
  vehicle_id: string | null;
  vehicle_name: string | null;
  auto_apply: boolean;
  created_at: string;
  promo_text: string | null;
};

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<CouponRow>(
    `
      SELECT c.id, c.code, c.discount_percent, c.valid_from, c.valid_to, c.active,
             c.vehicle_id, c.auto_apply, c.created_at, c.promo_text,
             v.name AS vehicle_name
      FROM coupons c
      LEFT JOIN vehicles v ON v.id = c.vehicle_id
      ORDER BY c.created_at DESC
    `
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    code?: string;
    discountPercent?: number;
    validFrom?: string;
    validTo?: string;
    vehicleId?: string | null;
    autoApply?: boolean;
    promoText?: string | null;
  };

  const code = body.code?.trim().toUpperCase();

  if (!code || !body.discountPercent || !body.validFrom || !body.validTo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let dbVehicleId: string | null = null;

  if (body.vehicleId) {
    const staticVehicle = staticVehicles.find((v) => v.id === body.vehicleId);
    if (staticVehicle) {
      const vehicleResult = await query<{ id: string }>(
        "SELECT id FROM vehicles WHERE slug = $1 LIMIT 1",
        [staticVehicle.slug]
      );
      dbVehicleId = vehicleResult.rows[0]?.id ?? null;
    }
  }

  await query(
    `
      INSERT INTO coupons (code, discount_percent, valid_from, valid_to, active, vehicle_id, auto_apply, promo_text)
      VALUES ($1, $2, $3::date, $4::date, TRUE, $5, $6, $7)
    `,
    [code, body.discountPercent, body.validFrom, body.validTo, dbVehicleId, body.autoApply ?? false, body.promoText?.trim() || null]
  );

  return NextResponse.json({ success: true });
}
