import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Phase 1: basic sitemap. We'll add categories + published articles in Phase 2.
  return [
    {
      url: "https://knotshorts.com",
      lastModified: new Date(),
    },
  ];
}
