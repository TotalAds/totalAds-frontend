import type { MetadataRoute } from "next";

import { seoConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/signup", "/email/pricing", "/email/docs"],
        disallow: [
          "/email/dashboard",
          "/email/campaigns",
          "/email/leads",
          "/email/settings",
          "/email/workspaces",
          "/email/mcp",
          "/social",
          "/whatsapp",
          "/help",
          "/auth",
        ],
      },
    ],
    sitemap: `${seoConfig.baseUrl}/sitemap.xml`,
  };
}
