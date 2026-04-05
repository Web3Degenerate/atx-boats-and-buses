import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin-auth";

type WaiverTemplateRow = {
  id: string;
  vehicle_type: string;
  title: string;
  body: string;
  updated_at: string;
};

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<WaiverTemplateRow>(
    `
      SELECT id, vehicle_type, title, body, updated_at::text
      FROM waiver_templates
      ORDER BY vehicle_type ASC
    `
  );

  return NextResponse.json(result.rows);
}
