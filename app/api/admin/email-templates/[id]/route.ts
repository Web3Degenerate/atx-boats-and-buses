import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getBearerToken, verifyAdminToken } from "@/lib/admin-auth";

function isAuthorized(request: NextRequest): boolean {
  const token = getBearerToken(request);
  return Boolean(token && verifyAdminToken(token));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { subject?: string; html_body?: string };

  if (body.subject === undefined || body.html_body === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await query(
    "UPDATE email_templates SET subject = $1, html_body = $2, updated_at = NOW() WHERE id = $3",
    [body.subject, body.html_body, params.id]
  );

  return NextResponse.json({ success: true });
}
