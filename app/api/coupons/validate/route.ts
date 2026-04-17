import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { vehicles } from "@/data/vehicles";

export const dynamic = "force-dynamic";

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { code?: string; vehicleId?: string | null };
  const code = body.code?.trim();

  if (!code) {
    return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
  }

  let dbVehicleId: string | null = null;
  if (body.vehicleId) {
    const vehicle = vehicles.find((entry) => entry.id === body.vehicleId);
    if (vehicle) {
      const vehicleResult = await query<{ id: string }>(
        "SELECT id FROM vehicles WHERE slug = $1 LIMIT 1",
        [vehicle.slug]
      );
      dbVehicleId = vehicleResult.rows[0]?.id ?? null;
    }
  }

  const result = await query<CouponRow>(
    `
      SELECT id, code, discount_percent
      FROM coupons
      WHERE UPPER(code) = UPPER($1)
        AND active = TRUE
        AND valid_from <= CURRENT_DATE
        AND valid_to >= CURRENT_DATE
        AND (vehicle_id = $2 OR vehicle_id IS NULL)
      LIMIT 1
    `,
    [code, dbVehicleId]
  );

  const coupon = result.rows[0];

  if (!coupon) {
    return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
  }

  return NextResponse.json({
    id: coupon.id,
    code: coupon.code,
    discountPercent: coupon.discount_percent
  });
}
