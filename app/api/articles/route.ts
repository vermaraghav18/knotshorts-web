// app/api/articles/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";
import { slugify } from "@/src/lib/slug";
import { normalizeImageUrl } from "@/src/lib/imageUrl";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

type ArticleDoc = {
  _id?: ObjectId;
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

function bool01(v: any) {
  return Number(v) === 1 || v === true ? 1 : 0;
}

async function getCollection() {
  const client = await getMongoClient();
  const dbName = getMongoDbName();
  return client.db(dbName).collection<ArticleDoc>("articles");
}

export async function GET() {
  try {
    const col = await getCollection();
    const rows = await col.find({}).sort({ createdAt: -1 }).toArray();

    const articles = rows.map((a) => ({
      id: String(a._id),
      title: a.title,
      slug: a.slug,
      summary: a.summary,
      category: a.category,
      status: a.status,
      featured: a.featured ?? 0,
      breaking: a.breaking ?? 0,
      ticker: a.ticker ?? 0,

      mainHero: a.mainHero ?? 0,
      mainHeroSlot: a.mainHeroSlot ?? null,

      hero2: a.hero2 ?? 0,
      hero2Slot: a.hero2Slot ?? null,

      hero3: a.hero3 ?? 0,
      hero3Slot: a.hero3Slot ?? null,

      publishedAt: a.publishedAt ?? null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      coverImage: a.coverImage ?? null,
    }));

    return NextResponse.json({ ok: true, articles });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load articles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const col = await getCollection();
    const data = await req.json();

    const title = String(data.title || "").trim();
    const summary = String(data.summary || "").trim();
    const body = String(data.body || "").trim();
    const category = String(data.category || "").trim() || "World";

    if (!title || !summary || !body) {
      return NextResponse.json(
        { ok: false, error: "Title, summary and body are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    let slug = slugify(data.slug ? String(data.slug) : title);
    const exists = await col.findOne({ slug }, { projection: { _id: 1 } });
    if (exists) slug = `${slug}-${id.slice(0, 6)}`;

    const tags = Array.isArray(data.tags)
      ? data.tags.filter((x: any) => typeof x === "string")
      : [];

    const coverImage = normalizeImageUrl(data.coverImage) || null;

    const featured = bool01(data.featured);
    const breaking = bool01(data.breaking);
    const ticker = bool01(data.ticker);

    const mainHero = bool01(data.mainHero);
    const mainHeroSlot =
      mainHero ? String(data.mainHeroSlot || "").trim() || null : null;

    const hero2 = bool01(data.hero2);
    const hero2Slot =
      hero2 ? String(data.hero2Slot || "").trim() || null : null;

    const hero3 = bool01(data.hero3);
    const hero3Slot =
      hero3 ? String(data.hero3Slot || "").trim() || null : null;

    const status: "draft" | "published" =
      data.status === "published" ? "published" : "draft";

    const publishedAt = status === "published" ? now : null;

    // Slot conflict clearing
    if (mainHero === 1 && mainHeroSlot) {
      await col.updateMany(
        { mainHero: 1, mainHeroSlot },
        { $set: { mainHero: 0, mainHeroSlot: null } }
      );
    }

    if (hero2 === 1 && hero2Slot) {
      await col.updateMany(
        { hero2: 1, hero2Slot },
        { $set: { hero2: 0, hero2Slot: null } }
      );
    }

    if (hero3 === 1 && hero3Slot) {
      await col.updateMany(
        { hero3: 1, hero3Slot },
        { $set: { hero3: 0, hero3Slot: null } }
      );
    }

    const doc: ArticleDoc = {
      title,
      slug,
      summary,
      body,
      category,
      tags,
      coverImage,

      featured,
      breaking,
      ticker,

      mainHero,
      mainHeroSlot,

      hero2,
      hero2Slot,

      hero3,
      hero3Slot,

      status,
      publishedAt,
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    return NextResponse.json({ ok: true, id: String(result.insertedId), slug });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create article" },
      { status: 500 }
    );
  }
}
