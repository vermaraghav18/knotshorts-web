// app/search/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
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

async function originFromHeaders() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp?.q ?? "").trim();

  if (q.length < 2) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Type at least <span className="font-semibold text-white">2 characters</span>{" "}
          in the search bar.
        </div>
      </main>
    );
  }

  const origin = await originFromHeaders();
  const url = `${origin}/api/search?q=${encodeURIComponent(q)}`;

  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as {
    ok: boolean;
    query: string;
    count: number;
    results: Article[];
    message?: string;
  };

  const resultsRaw = Array.isArray(data?.results) ? data.results : [];

  // Keep behavior consistent with category page:
  const articles = resultsRaw
    .filter((a) => a.status === "published")
    .filter((a) => hasValidSlug(a));

  // newest first (same logic as category page)
  articles.sort((a, b) => {
    const ad = new Date(a.publishedAt || a.createdAt).getTime();
    const bd = new Date(b.publishedAt || b.createdAt).getTime();
    return bd - ad;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Search results</h1>
        <p className="mt-1 text-white/70">
          Showing <span className="font-semibold text-white">{articles.length}</span>{" "}
          result(s) for <span className="font-semibold text-white">“{q}”</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {articles.map((a) => (
          <CategoryNewsCard key={a.id} article={a} />
        ))}

        {articles.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            No results found. Try a different keyword.
          </div>
        ) : null}
      </div>
    </main>
  );
}
