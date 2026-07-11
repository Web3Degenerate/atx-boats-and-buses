import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days — card auth holds expire at ~7.

type TokenPayload = {
  b: string;
  e: number;
};

function getSecret(): string | null {
  return process.env.NEXTAUTH_SECRET || null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createBookingActionToken(bookingId: string): string | null {
  const secret = getSecret();

  if (!secret) {
    return null;
  }

  const payload = Buffer.from(JSON.stringify({ b: bookingId, e: Date.now() + TOKEN_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyBookingActionToken(token: string): string | null {
  const secret = getSecret();

  if (!secret) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(payload, secret));
  const provided = Buffer.from(signature);

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  let parsed: TokenPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as TokenPayload;
  } catch {
    return null;
  }

  if (typeof parsed.b !== "string" || typeof parsed.e !== "number" || Date.now() > parsed.e) {
    return null;
  }

  return parsed.b;
}
