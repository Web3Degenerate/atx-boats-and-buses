"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Vehicles", href: "/#vehicles" },
  { label: "Contact", href: "/contact" }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="ATX Boats & Buses" width={300} height={50} className="h-[50px] w-auto" priority />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm font-medium text-slate-700 hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block h-0.5 w-6 bg-slate-700" />
          <span className="block h-0.5 w-6 bg-slate-700" />
          <span className="block h-0.5 w-6 bg-slate-700" />
        </button>
      </Container>
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <Container className="flex flex-col py-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-2 text-sm font-medium text-slate-700 hover:text-primary"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </Container>
        </div>
      )}
    </header>
  );
}
