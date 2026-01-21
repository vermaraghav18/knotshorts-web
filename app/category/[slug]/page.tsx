export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { isCategorySlug, labelForSlug } from "@/src/lib/categories";
import CategoryNewsCard from "@/app/components/CategoryNewsCard";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  status: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  coverImage?: string | null;
};

function hasValidSlug(a: Article) {
  return typeof a?.slug === "string" && a.slug.trim().length > 0;
}

async function getArticles(): Promise<Article[]> {
  const res = await fetch("http://localhost:3000/api/articles", {
    cache: "no-store",
  });

  const json = await res.json();
  return json?.articles || [];
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const safeSlug = String(slug || "").trim().toLowerCase();

  if (!safeSlug || !isCategorySlug(safeSlug)) notFound();

  const label = labelForSlug(safeSlug);
  if (!label) notFound();

  const all = await getArticles();

  const articles = all
    .filter((a) => a.status === "published")
    .filter((a) => a.category === label)
    .filter((a) => hasValidSlug(a));

  // newest first
  articles.sort((a, b) => {
    const ad = new Date(a.publishedAt || a.createdAt).getTime();
    const bd = new Date(b.publishedAt || b.createdAt).getTime();
    return bd - ad;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* ✅ Header strip removed: no title/count/back-to-home */}

      <div className="grid grid-cols-1 gap-4">
        {articles.map((a) => (
          <CategoryNewsCard key={a.id} article={a} />
        ))}

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            No published articles in this category yet.
          </div>
        ) : null}
      </div>
    </main>
  );
}
