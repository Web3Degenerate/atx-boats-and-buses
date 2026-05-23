import { redirect } from "next/navigation";
import BookingsClient from "@/components/admin/BookingsClient";
import { getAdminAccess } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const access = await getAdminAccess();

  if (!access) {
    redirect("/admin/login");
  }

  if (access.role === "waivers") {
    redirect("/admin/waivers");
  }

  return <BookingsClient />;
}
