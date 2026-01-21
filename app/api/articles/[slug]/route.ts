import { NextResponse } from "next/server";
import { getDb } from "@/src/lib/db";

export async function GET(
  req: Request,
  ctx: { params?: { slug?: string } }
) {
  // 1) Primary: Next params
  let slug = typeof ctx?.params?.slug === "string" ? ctx.params.slug : "";

  // 2) Fallback: parse from URL path (fixes "Missing slug" even when URL has it)
  if (!slug) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // .../api/articles/<slug>
    const last = parts[parts.length - 1] || "";
    if (last && last !== "articles") slug = last;
  }

  slug = decodeURIComponent(String(slug)).trim();

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Missing slug" },
      { status: 400 }
    );
  }

  const db = getDb();

  const row = db
    .prepare(
      `
      SELECT *
      FROM articles
      WHERE slug = ?
      LIMIT 1
    `
    )
    .get(slug);

  if (!row) {
    return NextResponse.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );
  }

  // tags parsing (safe)
  let tags: string[] = [];
  try {
    const parsed = JSON.parse((row as any).tags || "[]");
    tags = Array.isArray(parsed) ? parsed : [];
  } catch {
    tags = [];
  }

  return NextResponse.json({
    ok: true,
    article: {
      ...(row as any),
      tags,
    },
  });
}
