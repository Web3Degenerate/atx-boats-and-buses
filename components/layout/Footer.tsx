import Container from "@/components/ui/Container";
import Image from "next/image";

export default function Footer() {
  return (
    <footer id="contact" className="mt-16 border-t border-slate-200 bg-primary py-8">
      <Container className="flex flex-col items-center justify-between gap-3 text-center text-sm text-white md:flex-row md:text-left">
        <Image
          src="/images/logo-white.png"
          alt="ATX Boats & Buses"
          width={240}
          height={40}
          className="h-[40px] w-auto"
        />
        <p>© {new Date().getFullYear()} ATX Boats & Buses. All rights reserved.</p>
        <p>Austin, TX | (512) 555-0199 | hello@atxboatsandbuses.com</p>
      </Container>
    </footer>
  );
}
