// app/api/search/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/src/lib/db";

export const runtime = "nodejs"; // required (better-sqlite3)

function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, " ");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawQ = url.searchParams.get("q") ?? "";
    const q = normalizeQuery(rawQ);

    // Optional: allow drafts during dev/testing
    // /api/search?q=india&includeDraft=1
    const includeDraft =
      url.searchParams.get("includeDraft") === "1" ||
      url.searchParams.get("includeDraft") === "true";

    if (q.length < 2) {
      return NextResponse.json(
        { ok: true, query: q, count: 0, results: [], message: "Query too short" },
        { status: 200 }
      );
    }

    const db = getDb();
    const like = `%${q.toLowerCase()}%`;

    // ✅ Your DB uses status: 'published' | 'draft'
    // By default return only published.
    const rows = db
      .prepare(
        `
        SELECT
          id,
          title,
          slug,
          summary,
          category,
          coverImage,
          publishedAt,
          createdAt,
          status
        FROM articles
        WHERE
          (
            (? = 1) OR status = 'published'
          )
          AND (
            LOWER(title) LIKE ?
            OR LOWER(COALESCE(summary, '')) LIKE ?
            OR LOWER(COALESCE(body, '')) LIKE ?
            OR LOWER(COALESCE(category, '')) LIKE ?
            OR LOWER(COALESCE(tags, '')) LIKE ?
          )
        ORDER BY
          datetime(COALESCE(publishedAt, createdAt)) DESC
        LIMIT 50
        `
      )
      .all(includeDraft ? 1 : 0, like, like, like, like, like);

    return NextResponse.json(
      { ok: true, query: q, count: rows.length, results: rows },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Search failed",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
