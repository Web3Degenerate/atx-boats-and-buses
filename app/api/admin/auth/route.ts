import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, generateAdminToken, verifyAdminToken } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not configured" }, { status: 500 });
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = generateAdminToken();
  return NextResponse.json({ token });
}

export async function GET(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
