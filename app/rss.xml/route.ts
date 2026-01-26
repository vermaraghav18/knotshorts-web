// app/rss.xml/route.ts
import { NextResponse } from "next/server";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";

export const runtime = "nodejs";

const SITE_URL = "https://knotshorts.com";
const FEED_URL = `${SITE_URL}/rss.xml`;

type ArticleDoc = {
  _id?: any;
  title: string;
  slug: string;
  summary: string;
  category: string;
  status: "draft" | "published" | string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  coverImage?: string | null;
};

function escapeXml(input: string) {
  return String(input || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toRfc2822(dateStr?: string | null) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toUTCString();
  return d.toUTCString();
}

async function getCollection() {
  const client = await getMongoClient();
  const dbName = getMongoDbName();
  return client.db(dbName).collection<ArticleDoc>("articles");
}

function hasValidSlug(slug: unknown) {
  return typeof slug === "string" && slug.trim().length > 0;
}

function ensureAbsoluteUrl(url: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

function proxiedImageUrl(original: string) {
  // ✅ Use your crawlable proxy route (now allowed in robots)
  // It returns image/png but that's ok—RSS readers generally accept this.
  const u = encodeURIComponent(original);
  return `${SITE_URL}/api/image?url=${u}`;
}

export async function GET() {
  try {
    const col = await getCollection();

    // ✅ Only published, case-insensitive, must have slug
    const rows = await col
      .find({
        status: { $regex: /^published$/i },
        slug: { $exists: true, $ne: "" },
      })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray();

    const safeRows = rows.filter((r) => hasValidSlug(r.slug));

    const lastBuild =
      safeRows?.[0]?.publishedAt ||
      safeRows?.[0]?.updatedAt ||
      safeRows?.[0]?.createdAt ||
      new Date().toISOString();

    const itemsXml = safeRows
      .map((a) => {
        const title = escapeXml(a.title || "");
        const description = escapeXml(a.summary || "");
        const slug = String(a.slug || "").trim();
        const link = `${SITE_URL}/article/${encodeURIComponent(slug)}`;

        const pubDate = toRfc2822(a.publishedAt || a.createdAt);
        const guid = link;

        const category = a.category
          ? `<category>${escapeXml(a.category)}</category>`
          : "";

        // ✅ Optional image enclosure (absolute + through proxy)
        const enclosure =
          a.coverImage && String(a.coverImage).trim()
            ? `<enclosure url="${escapeXml(
                proxiedImageUrl(ensureAbsoluteUrl(String(a.coverImage)))
              )}" type="image/png" />`
            : "";

        return `
<item>
  <title>${title}</title>
  <link>${link}</link>
  <guid isPermaLink="true">${guid}</guid>
  <pubDate>${pubDate}</pubDate>
  ${category}
  <description><![CDATA[${description}]]></description>
  ${enclosure}
</item>`.trim();
      })
      .join("\n");

    // ✅ Proper atom namespace at root
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>KnotShorts</title>
  <link>${SITE_URL}</link>
  <description>Latest published articles from KnotShorts</description>
  <language>en</language>
  <lastBuildDate>${toRfc2822(lastBuild)}</lastBuildDate>
  <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml"/>
${itemsXml}
</channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        // ✅ RSS should be cacheable but fresh
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err: any) {
    // ✅ Keep RSS endpoint responding with RSS even on error (better for publishers)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>KnotShorts</title>
  <link>${SITE_URL}</link>
  <description>Latest published articles from KnotShorts</description>
  <language>en</language>
  <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml"/>
</channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
