// app/api/articles/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/src/lib/db";
import { slugify } from "@/src/lib/slug";
import { normalizeImageUrl } from "@/src/lib/imageUrl";

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        id,
        title,
        slug,
        summary,
        category,
        status,
        featured,
        breaking,
        ticker,

        -- ✅ Main News Container (Container 1)
        mainHero,
        mainHeroSlot,

        -- ✅ News Container 2
        hero2,
        hero2Slot,

        -- ✅ News Container 3
        hero3,
        hero3Slot,

        publishedAt,
        createdAt,
        updatedAt,
        coverImage
       FROM articles
       ORDER BY datetime(createdAt) DESC`
    )
    .all();

  return NextResponse.json({ ok: true, articles: rows });
}

export async function POST(req: Request) {
  const db = getDb();
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

  // ensure unique slug
  const exists = db.prepare(`SELECT 1 FROM articles WHERE slug = ?`).get(slug);
  if (exists) slug = `${slug}-${id.slice(0, 6)}`;

  const tags = JSON.stringify(Array.isArray(data.tags) ? data.tags : []);

  // ✅ normalize before storing
  const coverImage = normalizeImageUrl(data.coverImage) || null;

  // accept boolean true/false OR 1/0
  const featured = Number(data.featured) === 1 || data.featured === true ? 1 : 0;
  const breaking = Number(data.breaking) === 1 || data.breaking === true ? 1 : 0;
  const ticker = Number(data.ticker) === 1 || data.ticker === true ? 1 : 0;

  // ✅ Container 1
  const mainHero =
    Number(data.mainHero) === 1 || data.mainHero === true ? 1 : 0;

  const mainHeroSlot = mainHero
    ? String(data.mainHeroSlot || "").trim() || null
    : null;

  // ✅ Container 2
  const hero2 = Number(data.hero2) === 1 || data.hero2 === true ? 1 : 0;
  const hero2Slot = hero2 ? String(data.hero2Slot || "").trim() || null : null;

  // ✅ Container 3
  const hero3 = Number(data.hero3) === 1 || data.hero3 === true ? 1 : 0;
  const hero3Slot = hero3 ? String(data.hero3Slot || "").trim() || null : null;

  const status = data.status === "published" ? "published" : "draft";
  const publishedAt = status === "published" ? now : null;

  // ✅ If setting mainHero in a slot, clear other heroes in that slot
  if (mainHero === 1 && mainHeroSlot) {
    db.prepare(
      `UPDATE articles
       SET mainHero = 0, mainHeroSlot = NULL
       WHERE mainHero = 1 AND mainHeroSlot = ?`
    ).run(mainHeroSlot);
  }

  // ✅ If setting hero2 in a slot, clear other hero2 in that slot
  if (hero2 === 1 && hero2Slot) {
    db.prepare(
      `UPDATE articles
       SET hero2 = 0, hero2Slot = NULL
       WHERE hero2 = 1 AND hero2Slot = ?`
    ).run(hero2Slot);
  }

  // ✅ If setting hero3 in a slot, clear other hero3 in that slot
  if (hero3 === 1 && hero3Slot) {
    db.prepare(
      `UPDATE articles
       SET hero3 = 0, hero3Slot = NULL
       WHERE hero3 = 1 AND hero3Slot = ?`
    ).run(hero3Slot);
  }

  db.prepare(
    `INSERT INTO articles
     (
       id,
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
       createdAt,
       updatedAt
     )
     VALUES
     (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
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
    now,
    now
  );

  return NextResponse.json({ ok: true, id, slug });
}
