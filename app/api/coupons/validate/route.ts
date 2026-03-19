import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { code?: string };
  const code = body.code?.trim();

  if (!code) {
    return NextResponse.json({ error: "Invalid or expired coupon code." }, { status: 400 });
  }

  const result = await query<CouponRow>(
    `
      SELECT id, code, discount_percent
      FROM coupons
      WHERE UPPER(code) = UPPER($1)
        AND active = TRUE
        AND valid_from <= CURRENT_DATE
        AND valid_to >= CURRENT_DATE
      LIMIT 1
    `,
    [code]
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
