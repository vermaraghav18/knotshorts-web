// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";

export const runtime = "nodejs";

// keep sane limits (you can increase later)
const MAX_ARTICLES = 2000;

function escXml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db(getMongoDbName());
    const col = db.collection("articles");

    // 1) Published articles
    const articles = await col
      .find({
        status: { $regex: /^published$/i },
        slug: { $exists: true, $ne: "" },
      })
      .project({ slug: 1, updatedAt: 1, publishedAt: 1, createdAt: 1, category: 1 })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(MAX_ARTICLES)
      .toArray();

    // 2) Categories from published articles
    const categoriesRaw = await col.distinct("category", {
      status: { $regex: /^published$/i },
    });

    const categories = (Array.isArray(categoriesRaw) ? categoriesRaw : [])
      .map((c) => String(c || "").trim())
      .filter(Boolean)
      .map((c) => c.toLowerCase());

    // Build URL entries
    const urls: string[] = [];

    // Home
    urls.push(
      [
        "  <url>",
        "    <loc>https://knotshorts.com/</loc>",
        `    <lastmod>${new Date().toISOString()}</lastmod>`,
        "  </url>",
      ].join("\n")
    );

    // Category pages
    for (const cat of categories) {
      urls.push(
        [
          "  <url>",
          `    <loc>https://knotshorts.com/category/${encodeURIComponent(cat)}</loc>`,
          `    <lastmod>${new Date().toISOString()}</lastmod>`,
          "  </url>",
        ].join("\n")
      );
    }

    // Article pages
    for (const a of articles as any[]) {
      const slug = String(a.slug || "").trim();
      if (!slug) continue;

      const rawDate = a.updatedAt || a.publishedAt || a.createdAt;
      const dt = rawDate ? new Date(rawDate) : new Date();
      const lastmod = Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();

      urls.push(
        [
          "  <url>",
          `    <loc>https://knotshorts.com/article/${encodeURIComponent(slug)}</loc>`,
          `    <lastmod>${escXml(lastmod)}</lastmod>`,
          "  </url>",
        ].join("\n")
      );
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urls.join("\n")}\n` +
      `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    // Always return valid XML (never HTML error)
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
