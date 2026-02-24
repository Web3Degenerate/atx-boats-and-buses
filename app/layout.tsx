import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "ATX Boats & Buses | Austin Rentals",
    template: "%s | ATX Boats & Buses"
  },
  description:
    "Premium party boat and party bus rentals in Austin, TX. Perfect for birthdays, bachelorette parties, corporate events, and more. Book online today.",
  keywords: [
    "party bus Austin",
    "boat rental Austin",
    "ATX party bus",
    "Austin yacht rental",
    "bachelorette party Austin"
  ],
  openGraph: {
    title: "ATX Boats & Buses | Austin Rentals",
    description: "Premium party boat and party bus rentals in Austin, TX. Book online today.",
    url: "https://atxboatsandbuses.com",
    siteName: "ATX Boats & Buses",
    locale: "en_US",
    type: "website"
  },
  icons: {
    icon: "/images/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white font-sans">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
