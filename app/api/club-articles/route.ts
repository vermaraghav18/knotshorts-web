// app/api/club-articles/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/src/lib/db";
import {
  validateClubArticlesPayload,
  type ClubArticlesConfig,
} from "@/src/lib/clubArticles";

function safeParseIds(jsonText: string): string[] {
  try {
    const v = JSON.parse(jsonText);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// GET: return current config (or null)
export async function GET() {
  const db = getDb();

  const row = db
    .prepare(
      `SELECT position, articleIds, updatedAt
       FROM club_articles
       WHERE id = 1`
    )
    .get() as
    | { position: string; articleIds: string; updatedAt: string }
    | undefined;

  if (!row) {
    return NextResponse.json({ config: null }, { status: 200 });
  }

  const config: ClubArticlesConfig = {
    position: row.position as any,
    articleIds: safeParseIds(row.articleIds),
    updatedAt: row.updatedAt,
  };

  return NextResponse.json({ config }, { status: 200 });
}

// POST: save config (upsert)
export async function POST(req: Request) {
  const db = getDb();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validation = validateClubArticlesPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { position, articleIds } = validation.data;

  db.prepare(
    `
    INSERT INTO club_articles (id, position, articleIds, updatedAt)
    VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      position = excluded.position,
      articleIds = excluded.articleIds,
      updatedAt = excluded.updatedAt
    `
  ).run(position, JSON.stringify(articleIds), now);

  const config: ClubArticlesConfig = {
    position,
    articleIds,
    updatedAt: now,
  };

  return NextResponse.json({ ok: true, config }, { status: 200 });
}

// DELETE: clear config
export async function DELETE() {
  const db = getDb();
  db.prepare(`DELETE FROM club_articles WHERE id = 1`).run();
  return NextResponse.json({ ok: true }, { status: 200 });
}
