export const dynamic = "force-dynamic";

import Link from "next/link";
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
  const res = await fetch("http://127.0.0.1:3000/api/articles", {
    cache: "no-store",
  });
  const json = await res.json();
  return json?.articles || [];
}

export default async function AdminPage() {
  const articles = await getArticles();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin • Articles</h1>
          <Link
            href="/admin/new"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition"
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
