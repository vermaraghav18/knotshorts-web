// app/sitemap-news.xml/route.ts
import { NextResponse } from "next/server";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";

export const runtime = "nodejs";

// Google News expects ONLY URLs from the last 48 hours.
const NEWS_WINDOW_HOURS = 48;
const MAX_URLS = 100;

export async function GET() {
  // Always return well-formed XML even if DB errors happen
  // so Google doesn't see HTML error pages (which triggers "Missing XML tag").
  try {
    const client = await getMongoClient();
    const db = client.db(getMongoDbName());
    const col = db.collection("articles");

    const sinceMs = Date.now() - NEWS_WINDOW_HOURS * 60 * 60 * 1000;

    // Pull recent published docs; filter precisely below
    // (publishedAt is stored as string in this project).
    const articles = await col
      .find({
        status: { $regex: /^published$/i },
        slug: { $exists: true, $ne: "" },
      })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(MAX_URLS)
      .toArray();

    const urls = articles
      .map((a: any) => {
        const rawDate = a.publishedAt || a.createdAt || a.updatedAt;
        const dt = rawDate ? new Date(rawDate) : null;
        if (!dt || Number.isNaN(dt.getTime())) return null;

        // Google News: only last 48 hours
        if (dt.getTime() < sinceMs) return null;

        const title = String(a.title || "News")
          .replace(/\]\]>|\r?\n/g, " ")
          .trim();

        return [
          "  <url>",
          `    <loc>https://knotshorts.com/article/${a.slug}</loc>`,
          "    <news:news>",
          "      <news:publication>",
          "        <news:name>KnotShorts</news:name>",
          "        <news:language>en</news:language>",
          "      </news:publication>",
          `      <news:publication_date>${dt.toISOString()}</news:publication_date>`,
          `      <news:title><![CDATA[${title}]]></news:title>`,
          "    </news:news>",
          "  </url>",
        ].join("\n");
      })
      .filter(Boolean)
      .join("\n");

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset\n` +
      `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
      `  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
      `${urls}\n` +
      `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    // If anything fails, return a valid empty XML (not HTML).
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset\n` +
      `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
      `  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n` +
      `</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
