import type { MetadataRoute } from "next";

import { pageConfigs, seoConfig } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const indexablePages = Object.values(pageConfigs).filter(
    (page) => !page.noindex
  );

  return indexablePages.map((page) => ({
    url: page.canonical,
    lastModified: new Date(),
    changeFrequency:
      page.canonical.includes("/docs") ? "weekly" : "monthly",
    priority: page.canonical.includes("/signup")
      ? 1
      : page.canonical.includes("/login")
        ? 0.9
        : 0.7,
  }));
}
