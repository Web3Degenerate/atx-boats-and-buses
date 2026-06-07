import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SessionProvider from "@/components/providers/SessionProvider";

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

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
    icon: "/images/favicon.png"
  },
  other: adsenseClientId ? { "google-adsense-account": adsenseClientId } : undefined
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white font-sans">
        {adsenseClientId && (
          <Script
            id="adsense-loader"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
        <SessionProvider>
          <Navbar />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
