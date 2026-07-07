import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SessionProvider from "@/components/providers/SessionProvider";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  ...buildMetadata({
    title: "ATX Boats & Buses | Austin Corporate Boat Charters & Executive Bus Rentals",
    description: siteConfig.description,
    path: "/",
    image: "/images/boat-slider-image-default.webp"
  }),
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "ATX Boats & Buses | Austin Corporate Boat Charters & Executive Bus Rentals",
    template: "%s | ATX Boats & Buses"
  },
  keywords: [
    "corporate boat charter Austin",
    "executive bus rental Austin",
    "client appreciation event Austin",
    "corporate offsite transportation Austin",
    "Lake Travis corporate events",
    "Austin executive shuttle",
    "corporate motorcoach Texas",
    "executive bus Dallas Fort Worth San Antonio Houston"
  ],
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
