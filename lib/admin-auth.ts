import { NextRequest } from "next/server";

export const validAdminTokens = new Set<string>();

export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}
