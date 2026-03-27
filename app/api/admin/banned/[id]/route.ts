import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyAdminToken } from "@/lib/admin-auth";

function isAuthorized(request: NextRequest): boolean {
  const token = getBearerToken(request);
  return Boolean(token && verifyAdminToken(token));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await query("DELETE FROM banned_emails WHERE id = $1", [params.id]);

  return NextResponse.json({ success: true });
}
