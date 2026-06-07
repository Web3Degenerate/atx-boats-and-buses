import type { Metadata } from "next";
import { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminAccess } from "@/lib/admin-auth";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Admin",
  description: "Private ATX Boats & Buses administration area.",
  path: "/admin",
  noIndex: true
});

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await getAdminAccess();

  return <AdminShell access={access}>{children}</AdminShell>;
}
