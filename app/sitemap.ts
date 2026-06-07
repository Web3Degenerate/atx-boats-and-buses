import type { MetadataRoute } from "next";
import { vehicles } from "@/data/vehicles";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
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
      url: absoluteUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7
    }
  ];
  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
    url: absoluteUrl(`/vehicles/${vehicle.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
