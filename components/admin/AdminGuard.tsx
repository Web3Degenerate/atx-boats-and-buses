"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminAccess } from "@/lib/admin-auth";

type AdminGuardProps = {
  access: AdminAccess | null;
  children: ReactNode;
};

export default function AdminGuard({ access, children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { status } = useSession();

  useEffect(() => {
    if (isLoginPage || status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }

    if (!access) {
      router.replace("/admin/login");
      return;
    }

    if (access.role === "waivers" && pathname !== "/admin/waivers") {
      router.replace("/admin/waivers");
    }
  }, [access, isLoginPage, pathname, router, status]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return <p className="p-6 text-sm text-slate-600">Loading...</p>;
  }

  if (status === "unauthenticated" || !access) {
    return <p className="p-6 text-sm text-slate-600">Loading...</p>;
  }

  if (access?.role === "waivers" && pathname !== "/admin/waivers") {
    return <p className="p-6 text-sm text-slate-600">Loading...</p>;
  }

  return <>{children}</>;
}
