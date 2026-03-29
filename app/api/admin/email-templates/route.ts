import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

type EmailTemplateRow = {
  id: string;
  subject: string;
  html_body: string;
};

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<EmailTemplateRow>(
    "SELECT id, subject, html_body FROM email_templates ORDER BY id"
  );

  return NextResponse.json(result.rows);
}
