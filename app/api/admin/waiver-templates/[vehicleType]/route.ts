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

type UpdateBody = {
  title?: string;
  body?: string;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { vehicleType: string } }
) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdateBody;

  if (!body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  }

  const result = await query<WaiverTemplateRow>(
    `
      UPDATE waiver_templates
      SET title = $2,
          body = $3,
          updated_at = NOW()
      WHERE vehicle_type = $1
      RETURNING id, vehicle_type, title, body, updated_at::text
    `,
    [params.vehicleType, body.title.trim(), body.body]
  );

  const template = result.rows[0];

  if (!template) {
    return NextResponse.json({ error: "Waiver template not found." }, { status: 404 });
  }

  return NextResponse.json(template);
}
