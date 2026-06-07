export type SiteAddress = {
  streetAddress?: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  addressCountry: string;
};

export type SiteGeo = {
  latitude: number;
  longitude: number;
};

export type SiteConfig = {
  siteUrl: string;
  businessName: string;
  shortName: string;
  description: string;
  serviceAreas: string[];
  services: string[];
  telephone?: string;
  email: string;
  address?: SiteAddress;
  geo?: SiteGeo;
  openingHours?: string[];
  sameAs?: string[];
};

export const siteConfig: SiteConfig = {
  siteUrl: "https://www.atxboatsandbuses.com",
  businessName: "ATX Boats & Buses",
  shortName: "ATX Boats & Buses",
  description:
    "Premium party boat, yacht, party bus, and executive shuttle rentals for Austin events on Lake Austin, Lake Travis, and across Central Texas.",
  serviceAreas: ["Austin, TX", "Lake Austin", "Lake Travis", "Central Texas"],
  services: [
    "Austin party bus rentals",
    "Austin boat rentals",
    "Lake Austin boat rentals",
    "Lake Travis yacht charters",
    "Executive shuttle rentals",
    "Wedding transportation",
    "Corporate group transportation",
    "Bachelor and bachelorette party transportation"
  ],
  telephone: "+15127103801",
  email: "info@atxboatsandbuses.com"
};
