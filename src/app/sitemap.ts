import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/restaurant";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/la-carte`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/plats-du-jour`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/composer`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/le-restaurant`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/salade-paris-17`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
