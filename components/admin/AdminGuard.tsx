"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AdminGuardProps = {
  children: ReactNode;
};

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  const [checking, setChecking] = useState(!isLoginPage);
  const [authorized, setAuthorized] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      setAuthorized(true);
      return;
    }

    async function validateToken() {
      const token = window.localStorage.getItem("admin_token");

      if (!token) {
        router.replace("/admin/login");
        setChecking(false);
        return;
      }

      const response = await fetch("/api/admin/auth", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        window.localStorage.removeItem("admin_token");
        router.replace("/admin/login");
        setChecking(false);
        return;
      }

      setAuthorized(true);
      setChecking(false);
    }

    validateToken();
  }, [isLoginPage, router]);

  if (checking) {
    return <p className="p-6 text-sm text-slate-600">Loading...</p>;
  }

  if (!authorized) {
    return <p className="p-6 text-sm text-slate-600">Loading...</p>;
  }

  return <>{children}</>;
}
