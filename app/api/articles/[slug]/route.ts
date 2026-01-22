// app/api/articles/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";

export const runtime = "nodejs";

type ArticleDoc = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  coverImage: string | null;

  featured: number;
  breaking: number;
  ticker: number;

  mainHero: number;
  mainHeroSlot: string | null;

  hero2: number;
  hero2Slot: string | null;

  hero3: number;
  hero3Slot: string | null;

  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function getCollection() {
  const client = await getMongoClient();
  const dbName = getMongoDbName();
  return client.db(dbName).collection<ArticleDoc>("articles");
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const awaitedParams = await ctx.params;
    let slug = typeof awaitedParams?.slug === "string" ? awaitedParams.slug : "";

    // Fallback: parse from URL (handles rare param issues)
    if (!slug) {
      const url = new URL(req.url);
      const parts = url.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1] || "";
      if (last && last !== "articles") slug = last;
    }

    slug = decodeURIComponent(String(slug)).trim();
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
    }

    const col = await getCollection();
    const doc = await col.findOne({ slug });

    if (!doc) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      article: {
        id: String((doc as any)._id),
        ...doc,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load article" },
      { status: 500 }
    );
  }
}
