import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: [
      "https://knotshorts.com/sitemap.xml",
      "https://knotshorts.com/sitemap-news.xml",
    ],
  };
}
