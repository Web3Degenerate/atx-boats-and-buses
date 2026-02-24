import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-neutral-950 px-6 pb-8 pt-16 lg:px-12">
      <div className="mx-auto mb-12 grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="mb-4 flex items-center gap-3 text-2xl font-bold tracking-tighter uppercase">
            <div className="relative h-10 w-20">
              <Image src="/images/logo.png" alt="ATX Boats & Buses" fill className="object-contain" />
            </div>
            <div>
              ATX <span className="font-light text-neutral-400">Boats & Buses</span>
            </div>
          </Link>
          <p className="mb-6 max-w-sm text-neutral-400">
            Providing premium transportation and aquatic experiences in the heart of Texas.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/5"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/5"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:bg-white/5"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Services</h3>
          <ul className="space-y-3 text-neutral-400">
            <li>
              <Link href="/buses" className="transition-colors hover:text-white">
                Party Buses
              </Link>
            </li>
            <li>
              <Link href="/buses" className="transition-colors hover:text-white">
                Corporate Transport
              </Link>
            </li>
            <li>
              <Link href="/boats" className="transition-colors hover:text-white">
                Pontoon Rentals
              </Link>
            </li>
            <li>
              <Link href="/boats" className="transition-colors hover:text-white">
                Yacht Charters
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Company</h3>
          <ul className="space-y-3 text-neutral-400">
            <li>
              <Link href="/#about" className="transition-colors hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="#" className="transition-colors hover:text-white">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="#" className="transition-colors hover:text-white">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-neutral-500 md:flex-row">
        <p>&copy; {new Date().getFullYear()} ATX Boats & Buses. All rights reserved.</p>
        <p>Designed in Austin, TX</p>
      </div>
    </footer>
  );
}
