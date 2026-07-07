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
  priceRange?: string;
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
    "Executive bus and private yacht charters for Austin corporate offsites, client appreciation events, and executive group transportation on Lake Austin, Lake Travis, and across Central Texas.",
  serviceAreas: ["Austin, TX", "Lake Austin", "Lake Travis", "Central Texas"],
  services: [
    "Corporate offsite transportation",
    "Client appreciation event charters",
    "Executive bus and motorcoach rentals",
    "Private yacht and boat charters",
    "Lake Travis executive boat charters",
    "Lake Austin corporate boat rentals",
    "Executive shuttle rentals",
    "Corporate group transportation",
    "Statewide executive motorcoach travel (Dallas, Fort Worth, San Antonio, Houston, Hill Country)"
  ],
  telephone: "+15127103801",
  email: "info@atxboatsandbuses.com",
  priceRange: "$250 - $700 per hour",
  openingHours: ["Mo-Su 10:00-17:00"],
  sameAs: ["https://www.instagram.com/alcazarvela/", "https://www.linkedin.com/company/alcazarvela"]
};
