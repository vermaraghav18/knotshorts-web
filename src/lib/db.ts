// src/lib/db.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// ✅ Render: use DB_DIR if provided (you set DB_DIR=/var/data)
const DATA_DIR = process.env.DB_DIR
  ? path.resolve(process.env.DB_DIR)
  : path.join(process.cwd(), "data");

// ✅ The DB file name stays same
const DB_PATH = path.join(DATA_DIR, "knotshorts.db");

// ✅ Seed file is shipped with repo at /data/seed.json
const SEED_PATH = path.join(process.cwd(), "data", "seed.json");

let db: Database.Database | null = null;

function safeReadJsonFile(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function seedIfEmpty(db: Database.Database) {
  try {
    // ✅ If table has any rows, do nothing
    const countRow = db
      .prepare(`SELECT COUNT(1) as c FROM articles`)
      .get() as any;

    const count = Number(countRow?.c || 0);
    if (count > 0) return;

    // ✅ Read seed.json from repo
    const seed = safeReadJsonFile(SEED_PATH);
    const items: any[] = Array.isArray(seed) ? seed : Array.isArray(seed?.articles) ? seed.articles : [];

    if (!items.length) return;

    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT OR IGNORE INTO articles (
        id, title, slug, summary, body, category,
        tags, coverImage,
        featured, breaking, ticker,
        mainHero, mainHeroSlot,
        hero2, hero2Slot,
        hero3, hero3Slot,
        status, publishedAt,
        createdAt, updatedAt
      ) VALUES (
        @id, @title, @slug, @summary, @body, @category,
        @tags, @coverImage,
        @featured, @breaking, @ticker,
        @mainHero, @mainHeroSlot,
        @hero2, @hero2Slot,
        @hero3, @hero3Slot,
        @status, @publishedAt,
        @createdAt, @updatedAt
      )
    `);

    const tx = db.transaction((arr: any[]) => {
      for (const a of arr) {
        const title = String(a?.title || "").trim();
        const slug = String(a?.slug || "").trim();
        const summary = String(a?.summary || "").trim();
        const body = String(a?.body || "").trim();
        const category = String(a?.category || "").trim();

        // ✅ Skip broken docs
        if (!title || !slug || !summary || !body || !category) continue;

        const doc = {
          id: String(a?.id || crypto.randomUUID()),
          title,
          slug,
          summary,
          body,
          category,

          tags: JSON.stringify(Array.isArray(a?.tags) ? a.tags : []),
          coverImage: a?.coverImage ? String(a.coverImage) : null,

          featured: a?.featured === 1 || a?.featured === true ? 1 : 0,
          breaking: a?.breaking === 1 || a?.breaking === true ? 1 : 0,
          ticker: a?.ticker === 1 || a?.ticker === true ? 1 : 0,

          mainHero: a?.mainHero === 1 || a?.mainHero === true ? 1 : 0,
          mainHeroSlot: a?.mainHeroSlot ? String(a.mainHeroSlot) : null,

          hero2: a?.hero2 === 1 || a?.hero2 === true ? 1 : 0,
          hero2Slot: a?.hero2Slot ? String(a.hero2Slot) : null,

          hero3: a?.hero3 === 1 || a?.hero3 === true ? 1 : 0,
          hero3Slot: a?.hero3Slot ? String(a.hero3Slot) : null,

          status:
            String(a?.status || "published").toLowerCase() === "published"
              ? "published"
              : "draft",

          publishedAt:
            String(a?.status || "published").toLowerCase() === "published"
              ? String(a?.publishedAt || now)
              : null,

          createdAt: String(a?.createdAt || now),
          updatedAt: String(a?.updatedAt || now),
        };

        insert.run(doc);
      }
    });

    tx(items);
  } catch {
    // ✅ Never crash production because of seed
    return;
  }
}

export function getDb() {
  if (db) return db;

  ensureDir(DATA_DIR);

  db = new Database(DB_PATH);

  // Performance + safety defaults
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      coverImage TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      breaking INTEGER NOT NULL DEFAULT 0,
      ticker INTEGER NOT NULL DEFAULT 0,

      mainHero INTEGER NOT NULL DEFAULT 0,
      mainHeroSlot TEXT,

      hero2 INTEGER NOT NULL DEFAULT 0,
      hero2Slot TEXT,

      hero3 INTEGER NOT NULL DEFAULT 0,
      hero3Slot TEXT,

      status TEXT NOT NULL DEFAULT 'draft',
      publishedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_status_publishedAt
      ON articles(status, publishedAt);

    CREATE INDEX IF NOT EXISTS idx_articles_category
      ON articles(category);

    CREATE INDEX IF NOT EXISTS idx_articles_createdAt
      ON articles(createdAt);

    CREATE TABLE IF NOT EXISTS club_articles (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      position TEXT NOT NULL,
      articleIds TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spotlight_articles (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      position TEXT NOT NULL,
      articleIds TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS duo_articles (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      position TEXT NOT NULL,
      articleIds TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );
  `);

  // ✅ Migrations: ensure columns exist for older DB files
  const cols = db.prepare(`PRAGMA table_info(articles)`).all() as Array<{ name: string }>;

  const need = (name: string) => !cols.some((c) => c.name === name);

  if (need("ticker")) db.exec(`ALTER TABLE articles ADD COLUMN ticker INTEGER NOT NULL DEFAULT 0;`);
  if (need("mainHero")) db.exec(`ALTER TABLE articles ADD COLUMN mainHero INTEGER NOT NULL DEFAULT 0;`);
  if (need("mainHeroSlot")) db.exec(`ALTER TABLE articles ADD COLUMN mainHeroSlot TEXT;`);
  if (need("hero2")) db.exec(`ALTER TABLE articles ADD COLUMN hero2 INTEGER NOT NULL DEFAULT 0;`);
  if (need("hero2Slot")) db.exec(`ALTER TABLE articles ADD COLUMN hero2Slot TEXT;`);
  if (need("hero3")) db.exec(`ALTER TABLE articles ADD COLUMN hero3 INTEGER NOT NULL DEFAULT 0;`);
  if (need("hero3Slot")) db.exec(`ALTER TABLE articles ADD COLUMN hero3Slot TEXT;`);

  // ✅ THE IMPORTANT PART: seed once DB exists
  seedIfEmpty(db);

  return db;
}
