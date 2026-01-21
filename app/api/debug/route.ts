import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDb } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  const dataDir = process.env.DB_DIR
    ? path.resolve(process.env.DB_DIR)
    : path.join(process.cwd(), "data");

  const dbPath = path.join(dataDir, "knotshorts.db");
  const seedPath = path.join(process.cwd(), "data", "seed.json");

  let count = 0;
  try {
    const row = db.prepare(`SELECT COUNT(1) as c FROM articles`).get() as any;
    count = Number(row?.c || 0);
  } catch {
    count = -1;
  }

  return NextResponse.json({
    ok: true,
    env: {
      DB_DIR: process.env.DB_DIR || null,
      NODE_ENV: process.env.NODE_ENV || null,
    },
    paths: {
      dataDir,
      dbPath,
      seedPath,
    },
    exists: {
      dataDir: fs.existsSync(dataDir),
      dbFile: fs.existsSync(dbPath),
      seedFile: fs.existsSync(seedPath),
    },
    counts: {
      articles: count,
    },
  });
}
