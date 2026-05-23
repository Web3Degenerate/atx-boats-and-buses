import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isWaiverAdminAuthorized } from "@/lib/admin-auth";

type WaiverPdfRow = {
  pdf_data: Buffer | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isWaiverAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await query<WaiverPdfRow>(
    "SELECT pdf_data FROM signed_waivers WHERE id = $1 LIMIT 1",
    [params.id]
  );

  const waiver = result.rows[0];

  if (!waiver?.pdf_data) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(waiver.pdf_data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ATX-Waiver-Signed.pdf"'
    }
  });
}
