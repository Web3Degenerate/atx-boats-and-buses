import crypto from "crypto";
import { NextRequest } from "next/server";

export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
}

function computeAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD || "";
  return crypto.createHmac("sha256", password).update("admin-session").digest("hex");
}

export function generateAdminToken(): string {
  return computeAdminToken();
}

export function verifyAdminToken(token: string): boolean {
  const expected = computeAdminToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
