// src/lib/db.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// Store DB in /data so it's easy to find/backup
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "knotshorts.db");

// One shared connection (SQLite is file-based)
let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

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

      -- ✅ Main News Container feature (Container 1)
      mainHero INTEGER NOT NULL DEFAULT 0,
      mainHeroSlot TEXT,

      -- ✅ News Container 2 feature
      hero2 INTEGER NOT NULL DEFAULT 0,
      hero2Slot TEXT,

      -- ✅ News Container 3 feature
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

    -- ✅ Club Articles (1 main + 4 bottom) configuration (single active row)
    CREATE TABLE IF NOT EXISTS club_articles (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      position TEXT NOT NULL,
      articleIds TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );

    -- ✅ Spotlight Articles (1 main + 2 bottom) configuration (single active row)
    CREATE TABLE IF NOT EXISTS spotlight_articles (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      position TEXT NOT NULL,
      articleIds TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );

    -- ✅ Duo Articles (2 articles) configuration (single active row)
    CREATE TABLE IF NOT EXISTS duo_articles (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      position TEXT NOT NULL,
      articleIds TEXT NOT NULL DEFAULT '[]',
      updatedAt TEXT NOT NULL
    );
  `);

  // ✅ Migrations: ensure columns exist for older DB files
  const cols = db
    .prepare(`PRAGMA table_info(articles)`)
    .all() as Array<{ name: string }>;

  const hasTicker = cols.some((c) => c.name === "ticker");
  if (!hasTicker) {
    db.exec(`ALTER TABLE articles ADD COLUMN ticker INTEGER NOT NULL DEFAULT 0;`);
  }

  const hasMainHero = cols.some((c) => c.name === "mainHero");
  if (!hasMainHero) {
    db.exec(`ALTER TABLE articles ADD COLUMN mainHero INTEGER NOT NULL DEFAULT 0;`);
  }

  const hasMainHeroSlot = cols.some((c) => c.name === "mainHeroSlot");
  if (!hasMainHeroSlot) {
    db.exec(`ALTER TABLE articles ADD COLUMN mainHeroSlot TEXT;`);
  }

  // ✅ Container 2 columns
  const hasHero2 = cols.some((c) => c.name === "hero2");
  if (!hasHero2) {
    db.exec(`ALTER TABLE articles ADD COLUMN hero2 INTEGER NOT NULL DEFAULT 0;`);
  }

  const hasHero2Slot = cols.some((c) => c.name === "hero2Slot");
  if (!hasHero2Slot) {
    db.exec(`ALTER TABLE articles ADD COLUMN hero2Slot TEXT;`);
  }

  // ✅ Container 3 columns
  const hasHero3 = cols.some((c) => c.name === "hero3");
  if (!hasHero3) {
    db.exec(`ALTER TABLE articles ADD COLUMN hero3 INTEGER NOT NULL DEFAULT 0;`);
  }

  const hasHero3Slot = cols.some((c) => c.name === "hero3Slot");
  if (!hasHero3Slot) {
    db.exec(`ALTER TABLE articles ADD COLUMN hero3Slot TEXT;`);
  }

  return db;
}
