import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Vehicles", href: "/#vehicles" },
  { label: "Contact", href: "/contact" }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/images/logo.png" alt="ATX Boats & Buses" width={300} height={50} className="h-[50px] w-auto" priority />
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm font-medium text-slate-700 hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
