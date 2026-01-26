// app/category/[slug]/page.tsx
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isCategorySlug, labelForSlug } from "@/src/lib/categories";
import CategoryNewsCard from "@/app/components/CategoryNewsCard";

const SITE_NAME = "KnotShorts";
const SITE_URL = "https://knotshorts.com";

/* ---------------------------
   Phase 1.5 — Category Metadata
---------------------------- */
function titleCase(s: string) {
  return s
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const p =
    typeof (props.params as any)?.then === "function"
      ? await (props.params as Promise<{ slug: string }>)
      : (props.params as { slug: string });

  const rawSlug = decodeURIComponent(String(p?.slug || "")).trim().toLowerCase();

  if (!rawSlug || !isCategorySlug(rawSlug)) {
    return {
      title: SITE_NAME,
      alternates: { canonical: SITE_URL },
      robots: { index: true, follow: true },
    };
  }

  const label = labelForSlug(rawSlug);
  if (!label) {
    return {
      title: SITE_NAME,
      alternates: { canonical: SITE_URL },
      robots: { index: true, follow: true },
    };
  }

  const labelPretty = titleCase(label);
  const canonical = `${SITE_URL}/category/${encodeURIComponent(rawSlug)}`;

  return {
    title: `${labelPretty} News`,
    description: `Latest ${labelPretty} news, updates, and explainers from KnotShorts.`,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${labelPretty} News`,
      description: `Latest ${labelPretty} news from KnotShorts.`,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${labelPretty} News`,
      description: `Latest ${labelPretty} news from KnotShorts.`,
    },
  };
}

/* ---------------------------
   Existing Page Logic (UNCHANGED)
---------------------------- */

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
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/articles`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API /api/articles failed (${res.status}): ${text.slice(0, 200)}`
    );
  }

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

  articles.sort((a, b) => {
    const ad = new Date(a.publishedAt || a.createdAt).getTime();
    const bd = new Date(b.publishedAt || b.createdAt).getTime();
    return bd - ad;
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
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
