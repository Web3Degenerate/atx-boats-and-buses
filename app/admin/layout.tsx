import { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminAccess } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAdminAccess();

  return <AdminShell access={access}>{children}</AdminShell>;
}
