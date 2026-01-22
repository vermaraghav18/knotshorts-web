// app/api/articles/id/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";
import { slugify } from "@/src/lib/slug";
import { normalizeImageUrl } from "@/src/lib/imageUrl";

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

type Payload = Partial<{
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  tags: string[] | string;
  coverImage: string | null;

  featured: number | boolean | string;
  breaking: number | boolean | string;
  ticker: number | boolean | string;

  mainHero: number | boolean | string;
  mainHeroSlot: string | null;

  hero2: number | boolean | string;
  hero2Slot: string | null;

  hero3: number | boolean | string;
  hero3Slot: string | null;

  status: string;
  publishedAt: string | null;
}>;

function toInt01(v: any) {
  return v === true || v === 1 || v === "1" ? 1 : 0;
}

function safeTags(tagsRaw: any): string[] {
  if (Array.isArray(tagsRaw)) return tagsRaw.filter((t) => typeof t === "string");
  if (typeof tagsRaw !== "string") return [];
  try {
    const parsed = JSON.parse(tagsRaw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
}

function resolveId(req: Request, params: any) {
  const raw = params?.id;

  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw[0]?.trim()) return raw[0].trim();

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

async function getCollection() {
  const client = await getMongoClient();
  const dbName = getMongoDbName();
  return client.db(dbName).collection<ArticleDoc>("articles");
}

function docToApi(doc: any) {
  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    body: doc.body,
    category: doc.category,
    status: doc.status,
    featured: doc.featured ?? 0,
    breaking: doc.breaking ?? 0,
    ticker: doc.ticker ?? 0,
    mainHero: doc.mainHero ?? 0,
    mainHeroSlot: doc.mainHeroSlot ?? null,
    hero2: doc.hero2 ?? 0,
    hero2Slot: doc.hero2Slot ?? null,
    hero3: doc.hero3 ?? 0,
    hero3Slot: doc.hero3Slot ?? null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    coverImage: doc.coverImage ?? null,
    publishedAt: doc.publishedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const id = resolveId(req, awaitedParams);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const col = await getCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, article: docToApi(doc) });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load article" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const id = resolveId(req, awaitedParams);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const payload: Payload = await req.json().catch(() => ({} as any));

    const title = String(payload.title || "").trim();
    const summary = String(payload.summary || "").trim();
    const body = String(payload.body || "").trim();
    const category = String(payload.category || "").trim();

    if (!title || !summary || !body || !category) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = payload.slug ? slugify(String(payload.slug)) : slugify(title);

    const featured = toInt01(payload.featured);
    const breaking = toInt01(payload.breaking);
    const ticker = toInt01(payload.ticker);

    const mainHero = toInt01(payload.mainHero);
    const mainHeroSlot =
      mainHero === 1 && payload.mainHeroSlot?.trim()
        ? payload.mainHeroSlot.trim()
        : null;

    const hero2 = toInt01(payload.hero2);
    const hero2Slot =
      hero2 === 1 && payload.hero2Slot?.trim()
        ? payload.hero2Slot.trim()
        : null;

    const hero3 = toInt01(payload.hero3);
    const hero3Slot =
      hero3 === 1 && payload.hero3Slot?.trim()
        ? payload.hero3Slot.trim()
        : null;

    const status =
      String(payload.status).toLowerCase() === "published" ? "published" : "draft";

    const now = new Date().toISOString();
    const publishedAt = status === "published" ? payload.publishedAt || now : null;

    const coverImage = payload.coverImage ? normalizeImageUrl(payload.coverImage) : null;

    const col = await getCollection();
    const _id = new ObjectId(id);

    // ✅ slot uniqueness rules (same behavior as your SQLite version)
    if (mainHero === 1 && mainHeroSlot) {
      await col.updateMany(
        { _id: { $ne: _id }, mainHero: 1, mainHeroSlot },
        { $set: { mainHero: 0, mainHeroSlot: null, updatedAt: now } }
      );
    }
    if (hero2 === 1 && hero2Slot) {
      await col.updateMany(
        { _id: { $ne: _id }, hero2: 1, hero2Slot },
        { $set: { hero2: 0, hero2Slot: null, updatedAt: now } }
      );
    }
    if (hero3 === 1 && hero3Slot) {
      await col.updateMany(
        { _id: { $ne: _id }, hero3: 1, hero3Slot },
        { $set: { hero3: 0, hero3Slot: null, updatedAt: now } }
      );
    }

    const update: Partial<ArticleDoc> & { updatedAt: string } = {
      title,
      slug,
      summary,
      body,
      category,
      tags: safeTags(payload.tags),
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
      status: status as any,
      publishedAt,
      updatedAt: now,
    };

    const result = await col.updateOne({ _id }, { $set: update });

    if (!result.matchedCount) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to update article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const awaitedParams = await params;
    const id = resolveId(req, awaitedParams);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "Invalid id" }, { status: 400 });
    }

    const col = await getCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (!result.deletedCount) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete article" },
      { status: 500 }
    );
  }
}
