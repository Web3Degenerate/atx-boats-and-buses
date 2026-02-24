"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import Container from "@/components/ui/Container";

const navLinks = [
  { label: "Bus Rentals", href: "/buses" },
  { label: "Boat Rentals", href: "/boats" },
  { label: "About Us", href: "/#about" },
  { label: "Contact", href: "/contact" }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-neutral-950 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tighter uppercase">
          <div className="relative h-8 w-16 lg:h-10 lg:w-20">
            <Image src="/images/logo.png" alt="ATX Boats & Buses" fill className="object-contain" priority />
          </div>
          <div>
            ATX <span className="font-light text-neutral-400">Boats & Buses</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium uppercase tracking-wide text-neutral-300 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button className="text-white md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <Menu className="h-6 w-6" />
        </button>
      </Container>
      {menuOpen && (
        <div className="border-t border-white/10 bg-neutral-950 md:hidden">
          <Container className="flex flex-col py-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="py-2 text-sm font-medium uppercase tracking-wide text-neutral-300 hover:text-white"
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
