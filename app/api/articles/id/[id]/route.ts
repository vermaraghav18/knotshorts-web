// app/api/articles/id/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { normalizeImageUrl } from "@/src/lib/imageUrl";

type Payload = {
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  category?: string;
  tags?: string[] | string;
  coverImage?: string | null;
  featured?: number | boolean;
  breaking?: number | boolean;
  ticker?: number | boolean;

  // ✅ Container 1
  mainHero?: number | boolean;
  mainHeroSlot?: string | null;

  // ✅ Container 2
  hero2?: number | boolean;
  hero2Slot?: string | null;

  // ✅ Container 3
  hero3?: number | boolean;
  hero3Slot?: string | null;

  status?: string;
  publishedAt?: string | null;
};

function toInt01(v: any) {
  return v === true || v === 1 || v === "1" ? 1 : 0;
}

function safeJsonParseTags(tagsRaw: any) {
  if (Array.isArray(tagsRaw)) return tagsRaw;
  if (typeof tagsRaw !== "string") return [];
  try {
    const parsed = JSON.parse(tagsRaw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
}

// ✅ Robust ID resolver
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const awaitedParams = await params;
  const id = resolveId(req, awaitedParams);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  const row: any = db.prepare(`SELECT * FROM articles WHERE id = ?`).get(id);
  if (!row) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    article: {
      ...row,
      tags: safeJsonParseTags(row.tags),
    },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const awaitedParams = await params;
  const id = resolveId(req, awaitedParams);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
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

  const slug = payload.slug
    ? slugify(String(payload.slug))
    : slugify(title);

  const tagsJson = JSON.stringify(safeJsonParseTags(payload.tags));
  const featured = toInt01(payload.featured);
  const breaking = toInt01(payload.breaking);
  const ticker = toInt01(payload.ticker);

  // ✅ Container 1
  const mainHero = toInt01(payload.mainHero);
  const mainHeroSlot =
    mainHero === 1 && payload.mainHeroSlot?.trim()
      ? payload.mainHeroSlot.trim()
      : null;

  if (mainHero === 1 && mainHeroSlot) {
    db.prepare(
      `UPDATE articles
       SET mainHero = 0, mainHeroSlot = NULL
       WHERE mainHero = 1 AND mainHeroSlot = ? AND id != ?`
    ).run(mainHeroSlot, id);
  }

  // ✅ Container 2
  const hero2 = toInt01(payload.hero2);
  const hero2Slot =
    hero2 === 1 && payload.hero2Slot?.trim()
      ? payload.hero2Slot.trim()
      : null;

  if (hero2 === 1 && hero2Slot) {
    db.prepare(
      `UPDATE articles
       SET hero2 = 0, hero2Slot = NULL
       WHERE hero2 = 1 AND hero2Slot = ? AND id != ?`
    ).run(hero2Slot, id);
  }

  // ✅ Container 3
  const hero3 = toInt01(payload.hero3);
  const hero3Slot =
    hero3 === 1 && payload.hero3Slot?.trim()
      ? payload.hero3Slot.trim()
      : null;

  if (hero3 === 1 && hero3Slot) {
    db.prepare(
      `UPDATE articles
       SET hero3 = 0, hero3Slot = NULL
       WHERE hero3 = 1 AND hero3Slot = ? AND id != ?`
    ).run(hero3Slot, id);
  }

  const status =
    String(payload.status).toLowerCase() === "published"
      ? "published"
      : "draft";

  const now = new Date().toISOString();
  const publishedAt = status === "published" ? payload.publishedAt || now : null;

  const coverImage = payload.coverImage
    ? normalizeImageUrl(payload.coverImage)
    : null;

  const info = db
    .prepare(
      `
      UPDATE articles SET
        title = ?,
        slug = ?,
        summary = ?,
        body = ?,
        category = ?,
        tags = ?,
        coverImage = ?,
        featured = ?,
        breaking = ?,
        ticker = ?,

        mainHero = ?,
        mainHeroSlot = ?,

        hero2 = ?,
        hero2Slot = ?,

        hero3 = ?,
        hero3Slot = ?,

        status = ?,
        publishedAt = ?,
        updatedAt = ?
      WHERE id = ?
    `
    )
    .run(
      title,
      slug,
      summary,
      body,
      category,
      tagsJson,
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
      now,
      id
    );

  if (!info.changes) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const awaitedParams = await params;
  const id = resolveId(req, awaitedParams);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  const info = db.prepare(`DELETE FROM articles WHERE id = ?`).run(id);

  if (!info.changes) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
