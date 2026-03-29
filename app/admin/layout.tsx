"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { signOut } from "next-auth/react";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-primary">Admin</h1>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className="text-slate-700 hover:text-primary">
              Bookings
            </Link>
            <Link href="/admin/pricing" className="text-slate-700 hover:text-primary">
              Pricing
            </Link>
            <Link href="/admin/coupons" className="text-slate-700 hover:text-primary">
              Coupons
            </Link>
            <Link href="/admin/email-templates" className="text-slate-700 hover:text-primary">
              Email Templates
            </Link>
            <Link href="/admin/banned" className="text-slate-700 hover:text-primary">
              Banned Customers
            </Link>
            <Link href="/admin/blocked" className="text-slate-700 hover:text-primary">
              Blocked Dates
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/admin/login" })} className="text-slate-700 hover:text-primary">
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
