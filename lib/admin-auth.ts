import { getServerSession } from "next-auth";
import { query } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function isAdminAuthorized(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return false;
  }

  const result = await query(
    "SELECT email FROM admin_users WHERE LOWER(email) = LOWER($1) AND active = TRUE",
    [session.user.email]
  );

  return result.rows.length > 0;
}
