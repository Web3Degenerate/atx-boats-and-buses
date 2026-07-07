import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

// Best-effort, per-instance limiter: serverless instances each keep their own
// window, so real limits are a multiple of the configured value. Good enough
// to stop bursts and naive scripts without an external store.
const buckets = new Map<string, RateLimitEntry>();
const MAX_BUCKETS = 10_000;

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    if (buckets.size >= MAX_BUCKETS) {
      buckets.clear();
    }
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}
