import { getServerSession } from "next-auth";
import { query } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export type AdminAccess = {
  email: string;
  role: "admin" | "waivers";
};

function getWaiverOnlyEmails() {
  return (process.env.WAIVER_ONLY_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isWaiverOnlyEmail(email: string) {
  return getWaiverOnlyEmails().includes(email.toLowerCase());
}

async function isFullAdminEmail(email: string): Promise<boolean> {
  const result = await query(
    "SELECT email FROM admin_users WHERE LOWER(email) = LOWER($1) AND active = TRUE",
    [email]
  );

  return result.rows.length > 0;
}

export async function getAdminAccess(): Promise<AdminAccess | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  if (isWaiverOnlyEmail(email)) {
    return { email, role: "waivers" };
  }

  if (await isFullAdminEmail(email)) {
    return { email, role: "admin" };
  }

  return null;
}

export async function isAdminAuthorized(): Promise<boolean> {
  const access = await getAdminAccess();
  return access?.role === "admin";
}

export async function isWaiverAdminAuthorized(): Promise<boolean> {
  const access = await getAdminAccess();
  return Boolean(access);
}
