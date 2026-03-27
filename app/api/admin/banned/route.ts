import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyAdminToken } from "@/lib/admin-auth";

type BannedEmailRow = {
  id: string;
  email: string;
  reason: string | null;
  created_at: string;
};

function isAuthorized(request: NextRequest): boolean {
  const token = getBearerToken(request);
  return Boolean(token && verifyAdminToken(token));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<BannedEmailRow>(
    `
      SELECT id, email, reason, created_at
      FROM banned_emails
      ORDER BY created_at DESC
    `
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { email?: string; reason?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  await query(
    "INSERT INTO banned_emails (email, reason) VALUES ($1, $2)",
    [email, body.reason?.trim() || null]
  );

  return NextResponse.json({ success: true });
}
