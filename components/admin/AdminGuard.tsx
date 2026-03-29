"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const { status } = useSession();

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (status === "loading") {
    return <p className="p-6 text-sm text-slate-600">Loading...</p>;
  }

  if (status === "unauthenticated") {
    router.replace("/admin/login");
    return <p className="p-6 text-sm text-slate-600">Loading...</p>;
  }

  return <>{children}</>;
}
