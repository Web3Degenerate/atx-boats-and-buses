import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { query } from "@/lib/db";

const RECIPIENTS_KEY = "booking_alert_recipients";

export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<{ value: string }>(
    "SELECT value FROM site_settings WHERE key = $1 LIMIT 1",
    [RECIPIENTS_KEY]
  );

  return NextResponse.json({ recipients: result.rows[0]?.value || "" });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { recipients?: string };
  const entries = (body.recipients || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const invalid = entries.filter((entry) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry));

  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid address${invalid.length === 1 ? "" : "es"}: ${invalid.join(", ")}` },
      { status: 400 }
    );
  }

  await query(
    `
      INSERT INTO site_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `,
    [RECIPIENTS_KEY, entries.join(",")]
  );

  return NextResponse.json({ success: true, recipients: entries.join(",") });
}
