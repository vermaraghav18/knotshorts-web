// app/rss.xml/route.ts
import { NextResponse } from "next/server";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";

export const runtime = "nodejs";

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
  return input
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

function getOriginFromHeaders(headers: Headers) {
  const proto = headers.get("x-forwarded-proto") ?? "https";
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function GET(req: Request) {
  try {
    const origin = getOriginFromHeaders(req.headers);
    const siteLink = origin;
    const feedLink = `${origin}/rss.xml`;

    const col = await getCollection();

    // ✅ Only published articles
    const rows = await col
      .find({ status: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray();

    const lastBuild =
      rows?.[0]?.publishedAt ||
      rows?.[0]?.updatedAt ||
      rows?.[0]?.createdAt ||
      new Date().toISOString();

    const itemsXml = rows
      .map((a) => {
        const title = escapeXml(a.title || "");
        const description = escapeXml(a.summary || "");
        const slug = a.slug || "";
        const link = `${origin}/article/${encodeURIComponent(slug)}`;

        const pubDate = toRfc2822(a.publishedAt || a.createdAt);
        const guid = `${origin}/article/${encodeURIComponent(slug)}`;

        const category = a.category ? `<category>${escapeXml(a.category)}</category>` : "";

        // Optional image enclosure (safe if coverImage exists)
        const enclosure =
          a.coverImage && String(a.coverImage).trim()
            ? `<enclosure url="${escapeXml(String(a.coverImage))}" type="image/jpeg" />`
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

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>KnotShorts</title>
  <link>${siteLink}</link>
  <description>Latest published articles from KnotShorts</description>
  <language>en</language>
  <lastBuildDate>${toRfc2822(lastBuild)}</lastBuildDate>
  <atom:link href="${feedLink}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
${itemsXml}
</channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        // helps avoid stale cached feeds
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to generate RSS" },
      { status: 500 }
    );
  }
}
