"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { CalendarX, FileCheck, FileText, LayoutTemplate, Receipt, ShieldAlert, Tags } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/admin/AdminGuard";
import type { AdminAccess } from "@/lib/admin-auth";

type AdminShellProps = {
  access: AdminAccess | null;
  children: ReactNode;
};

const navLinks = [
  { href: "/admin", label: "Bookings", icon: Receipt },
  { href: "/admin/waivers", label: "Waivers", icon: FileCheck },
  { href: "/admin/waiver-templates", label: "Waiver Templates", icon: FileText },
  { href: "/admin/pricing", label: "Pricing", icon: Tags },
  { href: "/admin/coupons", label: "Coupons", icon: Tags },
  { href: "/admin/email-templates", label: "Email Templates", icon: LayoutTemplate },
  { href: "/admin/banned", label: "Banned Customers", icon: ShieldAlert },
  { href: "/admin/blocked", label: "Blocked Dates", icon: CalendarX }
];

export default function AdminShell({ access, children }: AdminShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const visibleNavLinks = access?.role === "waivers"
    ? navLinks.filter((link) => link.href === "/admin/waivers")
    : access?.role === "admin"
    ? navLinks
    : [];
  const showAdminControls = !isLoginPage && Boolean(access);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-primary">Admin</h1>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {showAdminControls && (
              <>
                {visibleNavLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-slate-700 hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
                <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="text-slate-700 hover:text-primary">
                  Sign Out
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <AdminGuard access={access}>{children}</AdminGuard>
      </main>
    </div>
  );
}
