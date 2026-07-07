import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import type { Vehicle } from "@/types";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

type JsonLdObject = Record<string, unknown>;

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.siteUrl}${normalizedPath}`;
}

export function buildMetadata({
  title,
  description,
  path,
  image = "/images/boat-slider-image-default.webp",
  noIndex = false
}: MetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.businessName,
      images: [
        {
          url: imageUrl
        }
      ],
      locale: "en_US",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    },
    robots: noIndex
      ? {
          index: false,
          follow: false
        }
      : undefined
  };
}

export function buildWebsiteJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.siteUrl}/#website`,
    name: siteConfig.businessName,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    inLanguage: "en-US"
  };
}

export function buildLocalBusinessJsonLd(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.siteUrl}/#localbusiness`,
    name: siteConfig.businessName,
    url: siteConfig.siteUrl,
    description: siteConfig.description,
    email: siteConfig.email,
    image: absoluteUrl("/images/logo.png"),
    logo: absoluteUrl("/images/logo.png"),
    ...(siteConfig.priceRange ? { priceRange: siteConfig.priceRange } : {}),
    areaServed: siteConfig.serviceAreas.map((area) => ({
      "@type": "Place",
      name: area
    })),
    knowsAbout: siteConfig.services,
    ...(siteConfig.telephone ? { telephone: siteConfig.telephone } : {}),
    ...(siteConfig.address
      ? {
          address: {
            "@type": "PostalAddress",
            ...siteConfig.address
          }
        }
      : {}),
    ...(siteConfig.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: siteConfig.geo.latitude,
            longitude: siteConfig.geo.longitude
          }
        }
      : {}),
    ...(siteConfig.openingHours ? { openingHours: siteConfig.openingHours } : {}),
    ...(siteConfig.sameAs ? { sameAs: siteConfig.sameAs } : {})
  };
}

export function buildFaqJsonLd(items: FaqItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function buildVehicleItemListJsonLd(name: string, vehicles: Vehicle[], path: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(path),
    itemListElement: vehicles.map((vehicle, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/vehicles/${vehicle.slug}`),
      name: vehicle.name
    }))
  };
}

export function buildVehicleServiceJsonLd(vehicle: Vehicle): JsonLdObject {
  const serviceType = vehicle.type === "party-bus" ? "Executive bus rental" : "Boat charter";

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${absoluteUrl(`/vehicles/${vehicle.slug}`)}#service`,
    name: `${vehicle.name} rental in Austin`,
    description: vehicle.description,
    serviceType,
    areaServed: siteConfig.serviceAreas.map((area) => ({
      "@type": "Place",
      name: area
    })),
    provider: {
      "@id": `${siteConfig.siteUrl}/#localbusiness`
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/vehicles/${vehicle.slug}`),
      priceCurrency: "USD",
      price: vehicle.pricePerHour,
      availability: "https://schema.org/InStock"
    }
  };
}
