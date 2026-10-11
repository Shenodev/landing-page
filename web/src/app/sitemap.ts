import type { MetadataRoute } from "next";

const BASE_URL = "https://shenodev.tech";

// Stable per-page dates. A per-request `new Date()` told Google "every URL changed
// on every crawl" (lastmod is then discounted). Bump these when the page changes.
const UPDATED = {
  site: "2026-09-29",
  legal: "2026-09-21",
} as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: UPDATED.site, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/work`, lastModified: UPDATED.site, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/discovery`, lastModified: UPDATED.site, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: UPDATED.legal, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: UPDATED.legal, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/refunds`, lastModified: UPDATED.legal, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE_URL}/cookies`, lastModified: UPDATED.legal, changeFrequency: "yearly", priority: 0.2 },
  ];
}
