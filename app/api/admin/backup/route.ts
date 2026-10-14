import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Every table the site uses. Read only: this route never changes data.
const BACKUP_TABLES = [
  "vehicles",
  "site_settings",
  "admin_users",
  "banned_emails",
  "coupons",
  "email_templates",
  "faqs",
  "waiver_templates",
  "blocked_dates",
  "bookings",
  "waiver_links",
  "signed_waivers",
  "waiver_minors",
  "waiver_reminders_sent"
] as const;

type BackupTable = (typeof BACKUP_TABLES)[number];

function isBackupTable(value: string): value is BackupTable {
  return (BACKUP_TABLES as readonly string[]).includes(value);
}

// GET /api/admin/backup                       -> row counts for every table
// GET /api/admin/backup?table=x&offset=0&limit=50 -> one page of rows as JSON
// Rows come from row_to_json, so dates stay as YYYY-MM-DD text and binary
// columns (signed waiver PDFs) arrive as "\x..." hex text. Nothing is lost.
export async function GET(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const table = request.nextUrl.searchParams.get("table");

  if (!table) {
    const counts: Record<string, number | null> = {};

    for (const name of BACKUP_TABLES) {
      try {
        const result = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${name}`);
        counts[name] = Number(result.rows[0]?.count ?? 0);
      } catch {
        counts[name] = null;
      }
    }

    return NextResponse.json({ counts });
  }

  if (!isBackupTable(table)) {
    return NextResponse.json({ error: "Unknown table" }, { status: 400 });
  }

  const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") ?? 0) || 0);
  const limit = Math.min(200, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 50) || 50));

  const result = await query<{ row: string }>(
    `SELECT row_to_json(t)::text AS row FROM (SELECT * FROM ${table} ORDER BY 1 LIMIT $1 OFFSET $2) t`,
    [limit, offset]
  );

  const body = `{"table":${JSON.stringify(table)},"offset":${offset},"rows":[${result.rows.map((r) => r.row).join(",")}]}`;

  return new NextResponse(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
