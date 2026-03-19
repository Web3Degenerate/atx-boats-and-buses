import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, validAdminTokens } from "@/lib/admin-auth";

type CouponRow = {
  id: string;
  code: string;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
  active: boolean;
  created_at: string;
};

function isAuthorized(request: NextRequest): boolean {
  const token = getBearerToken(request);
  return Boolean(token && validAdminTokens.has(token));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<CouponRow>(
    `
      SELECT id, code, discount_percent, valid_from, valid_to, active, created_at
      FROM coupons
      ORDER BY created_at DESC
    `
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    code?: string;
    discountPercent?: number;
    validFrom?: string;
    validTo?: string;
  };

  const code = body.code?.trim().toUpperCase();

  if (!code || !body.discountPercent || !body.validFrom || !body.validTo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await query(
    `
      INSERT INTO coupons (code, discount_percent, valid_from, valid_to, active)
      VALUES ($1, $2, $3::date, $4::date, TRUE)
    `,
    [code, body.discountPercent, body.validFrom, body.validTo]
  );

  return NextResponse.json({ success: true });
}
