// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/image"], // ✅ allow image proxy route for OG/images
        disallow: ["/admin", "/api"], // ✅ still block admin + most API
      },
    ],
    sitemap: [
      "https://knotshorts.com/sitemap.xml",
      "https://knotshorts.com/sitemap-news.xml",
    ],
  };
}
