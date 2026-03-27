import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyAdminToken } from "@/lib/admin-auth";

type EmailTemplateRow = {
  id: string;
  subject: string;
  html_body: string;
};

function isAuthorized(request: NextRequest): boolean {
  const token = getBearerToken(request);
  return Boolean(token && verifyAdminToken(token));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<EmailTemplateRow>(
    "SELECT id, subject, html_body FROM email_templates ORDER BY id"
  );

  return NextResponse.json(result.rows);
}
