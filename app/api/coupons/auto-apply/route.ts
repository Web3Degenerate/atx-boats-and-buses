import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { vehicles } from "@/data/vehicles";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const vehicleId = request.nextUrl.searchParams.get("vehicleId");
  if (!vehicleId) {
    return NextResponse.json({ coupon: null });
  }

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return NextResponse.json({ coupon: null });

  const vehicleResult = await query<{ id: string }>(
    "SELECT id FROM vehicles WHERE slug = $1 LIMIT 1",
    [vehicle.slug]
  );
  const dbVehicleId = vehicleResult.rows[0]?.id;
  if (!dbVehicleId) return NextResponse.json({ coupon: null });

  const result = await query<{
    id: string;
    code: string;
    discount_percent: number;
    valid_from: string;
    valid_to: string;
    promo_text: string | null;
  }>(
    `SELECT id, code, discount_percent, valid_from::text, valid_to::text, promo_text
     FROM coupons
     WHERE auto_apply = TRUE
       AND active = TRUE
       AND valid_from <= CURRENT_DATE
       AND valid_to >= CURRENT_DATE
       AND (vehicle_id = $1 OR vehicle_id IS NULL)
     ORDER BY (vehicle_id IS NOT NULL) DESC, created_at DESC
     LIMIT 1`,
    [dbVehicleId]
  );

  const coupon = result.rows[0];
  if (!coupon) return NextResponse.json({ coupon: null });

  return NextResponse.json({
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discount_percent,
      validFrom: coupon.valid_from,
      validTo: coupon.valid_to,
      promoText: coupon.promo_text
    }
  });
}
