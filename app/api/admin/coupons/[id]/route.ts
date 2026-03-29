import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { active?: boolean };

  if (body.active === undefined) {
    return NextResponse.json({ error: "Missing active value" }, { status: 400 });
  }

  await query("UPDATE coupons SET active = $1 WHERE id = $2", [body.active, params.id]);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await query("DELETE FROM coupons WHERE id = $1", [params.id]);

  return NextResponse.json({ success: true });
}
