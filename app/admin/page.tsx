// app/admin/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { headers } from "next/headers";
import ClubArticlesPicker from "./ClubArticlesPicker";

type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "draft" | "published";
  createdAt: string;
  publishedAt: string | null;
  coverImage: string | null;
};

async function getArticles(): Promise<Article[]> {
  const h = await headers(); // ✅ IMPORTANT: headers() is async in newer Next.js
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/articles`, {
    cache: "no-store",
  });

  // ✅ Prevent "Unexpected end of JSON input"
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API /api/articles failed (${res.status}): ${text.slice(0, 200)}`
    );
  }

  const json = await res.json();
  return json?.articles || [];
}

export default async function AdminPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin • Articles</h1>
          <Link
            href="/admin/new"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/10"
          >
            + New Article
          </Link>
        </div>

        {/* ✅ Client component renders the list + selection + modal */}
        <ClubArticlesPicker articles={articles} />

        {articles.length === 0 ? (
          <div className="mt-10 text-white/60">No articles yet.</div>
        ) : null}
      </div>
    </div>
  );
}
