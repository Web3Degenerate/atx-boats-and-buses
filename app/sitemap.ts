import type { MetadataRoute } from "next";
import { vehicles as staticVehicles } from "@/data/vehicles";
import { getPublishedFaqs } from "@/lib/faqs";
import { getVehicles } from "@/lib/vehicles";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: absoluteUrl("/buses"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: absoluteUrl("/boats"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: absoluteUrl("/faq"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    }
  ];

  let vehicleSlugs = staticVehicles.map((vehicle) => vehicle.slug);
  let faqRoutes: MetadataRoute.Sitemap = [];

  try {
    const [vehicles, faqs] = await Promise.all([getVehicles(), getPublishedFaqs()]);
    vehicleSlugs = vehicles.map((vehicle) => vehicle.slug);
    faqRoutes = faqs.map((faq) => ({
      url: absoluteUrl(`/faq/${faq.slug}`),
      lastModified: faq.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7
    }));
  } catch {
    // DB unavailable — fall back to static vehicle slugs and skip FAQ routes
    // rather than failing the whole sitemap.
  }

  const vehicleRoutes: MetadataRoute.Sitemap = vehicleSlugs.map((slug) => ({
    url: absoluteUrl(`/vehicles/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticRoutes, ...vehicleRoutes, ...faqRoutes];
}
