// app/article/[slug]/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { headers } from "next/headers";
import { getMongoClient, getMongoDbName } from "@/src/lib/mongodb";
import { proxiedImageSrc } from "@/src/lib/imageUrl";

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  status: "draft" | "published" | string;
  featured: number;
  breaking: number;
  ticker?: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: unknown; // Mongo can store array or string
  coverImage?: string | null;
};

type RelatedRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  coverImage?: string | null;
  publishedAt: string | null;
  createdAt: string;
};

function safeParseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x) => typeof x === "string") as string[];
  }
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function formatPrettyDate(isoOrDateString?: string | null) {
  if (!isoOrDateString) return "";
  const d = new Date(isoOrDateString);
  if (Number.isNaN(d.getTime())) return String(isoOrDateString).slice(0, 10);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function estimateReadingTimeMinutes(text: string) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const wpm = 220;
  const mins = Math.ceil(words / wpm);
  return Math.max(1, mins);
}

async function originFromHeaders() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

function buildShareUrls(canonicalUrl: string, title: string) {
  const u = encodeURIComponent(canonicalUrl);
  const t = encodeURIComponent(title);

  return {
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    whatsapp: `https://api.whatsapp.com/send?text=${t}%20${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  };
}

function hasValidSlug(slug: unknown) {
  return typeof slug === "string" && slug.trim().length > 0;
}

function docToRow(doc: any): ArticleRow {
  return {
    id: String(doc?._id ?? ""),
    title: String(doc?.title ?? ""),
    slug: String(doc?.slug ?? ""),
    summary: String(doc?.summary ?? ""),
    body: String(doc?.body ?? ""),
    category: String(doc?.category ?? ""),
    status: String(doc?.status ?? "draft"),
    featured: typeof doc?.featured === "number" ? doc.featured : 0,
    breaking: typeof doc?.breaking === "number" ? doc.breaking : 0,
    ticker: typeof doc?.ticker === "number" ? doc.ticker : 0,
    publishedAt: doc?.publishedAt ? String(doc.publishedAt) : null,
    createdAt: doc?.createdAt ? String(doc.createdAt) : new Date().toISOString(),
    updatedAt: doc?.updatedAt ? String(doc.updatedAt) : new Date().toISOString(),
    tags: doc?.tags,
    coverImage: doc?.coverImage ? String(doc.coverImage) : null,
  };
}

export default async function ArticlePage(props: {
  params: Promise<{ slug?: string }> | { slug?: string };
}) {
  const p =
    typeof (props.params as any)?.then === "function"
      ? await (props.params as Promise<{ slug?: string }>)
      : (props.params as { slug?: string });

  const slug = decodeURIComponent(String(p?.slug || "")).trim();

  if (!slug) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-2xl font-bold">Not found</h1>
          <p className="mt-2 text-white/60">Missing slug.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  // ✅ MongoDB: fetch the article by slug
  const client = await getMongoClient();
  const db = client.db(getMongoDbName());
  const col = db.collection("articles");

  const doc = await col.findOne({ slug });

  // Only show published articles on public page
  if (!doc || String((doc as any).status).toLowerCase() !== "published") {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-2xl font-bold">Not found</h1>
          <p className="mt-2 text-white/60">
            This article doesn’t exist (or it’s not published yet).
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const row = docToRow(doc);

  const tags = safeParseTags((row as any).tags);
  const publishedIso = row.publishedAt || row.createdAt;
  const datePretty = formatPrettyDate(publishedIso);

  const readMins = estimateReadingTimeMinutes(
    `${row.title || ""} ${row.summary || ""} ${row.body || ""}`
  );

  const origin = await originFromHeaders();
  const canonicalUrl = `${origin}/article/${encodeURIComponent(row.slug)}`;
  const share = buildShareUrls(canonicalUrl, row.title);

  // ✅ Latest 4 (published) excluding current article (MongoDB)
  const relatedDocs = await col
    .find({
      status: { $regex: /^published$/i },
      slug: { $ne: row.slug },
    })
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(4)
    .toArray();

  const related = relatedDocs.map((d: any) => ({
    id: String(d._id),
    title: String(d.title ?? ""),
    slug: String(d.slug ?? ""),
    category: String(d.category ?? ""),
    coverImage: d.coverImage ? String(d.coverImage) : null,
    publishedAt: d.publishedAt ? String(d.publishedAt) : null,
    createdAt: d.createdAt ? String(d.createdAt) : "",
  })) as RelatedRow[];

  const relatedSafe = Array.isArray(related)
    ? related.filter((r) => hasValidSlug(r.slug))
    : [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 pt-3 pb-8 md:pt-4 md:pb-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          {/* LEFT: Main content */}
          <div className="min-w-0">
            {/* Hero image FIRST */}
            {row.coverImage ? (
              <div
                className="
                  relative
                  mb-4
                  border border-white/10
                  overflow-hidden
                  shadow-[0_24px_80px_rgba(0,0,0,0.55)]
                "
                style={{
                  height: "clamp(260px, 50vh, 560px)",
                }}
              >
                {/* 🔹 Blurred background */}
                <img
                  src={proxiedImageSrc(row.coverImage)}
                  alt=""
                  aria-hidden
                  className="
                    absolute inset-0
                    w-full h-full
                    object-cover
                    scale-110
                    blur-2xl
                    opacity-60
                  "
                />

                {/* 🔹 Dark overlay for contrast */}
                <div className="absolute inset-0 bg-black/40" />

                {/* 🔹 Foreground image (never cropped) */}
                <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
                  <img
                    src={proxiedImageSrc(row.coverImage)}
                    alt={row.title}
                    loading="lazy"
                    className="
                      max-h-full
                      max-w-full
                      object-contain
                      drop-shadow-[0_16px_40px_rgba(0,0,0,0.75)]
                    "
                  />
                </div>
              </div>
            ) : null}

            {/* Pills BELOW image */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={`/category/${encodeURIComponent(
                  String(row.category || "").toLowerCase()
                )}`}
                className="border border-white/15 bg-white/5 px-3 py-1 text-white/70 hover:bg-white/10 transition"
              >
                {row.category}
              </Link>

              {row.breaking === 1 ? (
                <span className="border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-200">
                  Breaking
                </span>
              ) : null}

              {row.featured === 1 ? (
                <span className="border border-yellow-400/25 bg-yellow-400/10 px-3 py-1 text-yellow-100">
                  Featured
                </span>
              ) : null}

              <span className="border border-white/10 bg-white/5 px-3 py-1 text-white/60">
                {readMins} min read
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              {row.title}
            </h1>

            {/* ✅ Premium "IN BRIEF" summary card */}
            {row.summary ? (
              <section className="mt-5">
                <div
                  className="
                    relative
                    overflow-hidden
                    border border-white/10
                    bg-white/5
                    backdrop-blur
                    shadow-[0_12px_40px_rgba(0,0,0,0.55)]
                  "
                  style={{
                    boxShadow:
                      "0 12px 40px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className="absolute left-0 top-0 h-full w-[3px]"
                    style={{
                      background:
                        "linear-gradient(to bottom, #A027FF 0%, #FF17A5 35%, #FFCC18 70%, #FF7925 100%)",
                      boxShadow: `
                        0 0 10px rgba(160,39,255,0.45),
                        0 0 18px rgba(255,23,165,0.35),
                        0 0 26px rgba(255,204,24,0.25)
                      `,
                    }}
                  />

                  <div className="px-5 py-4 md:px-6 md:py-5">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sky-300">
                      In Brief
                    </div>

                    <p className="text-[15px] md:text-[17px] leading-relaxed text-white/75 max-w-[72ch]">
                      {row.summary}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <article
              className="
                mt-8
                max-w-none
                prose prose-invert
                font-serif
                [font-family:ui-serif,Georgia,Cambria,Times_New_Roman,Times,serif]
                text-[18px] md:text-[19px]
                prose-p:my-6
                prose-p:leading-[1.85]
                prose-p:text-white/80
                prose-headings:text-white
                prose-headings:tracking-tight
                prose-strong:text-white
                prose-a:text-sky-300 hover:prose-a:underline
                prose-blockquote:border-l-sky-400/40
                prose-blockquote:text-white/75
                prose-li:text-white/80
                prose-ul:my-6
                prose-ol:my-6
                prose-hr:border-white/10
              "
            >
              {String(row.body || "")
                .split("\n")
                .filter((p) => p.trim().length > 0)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </article>

            {/* Tags: optional on mobile only (after body) */}
            {tags.length > 0 ? (
              <div className="mt-8 md:hidden">
                <div className="text-xs text-white/50 mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT: Sticky sidebar */}
          <aside className="md:sticky md:top-16 h-fit">
            <div className="border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/85">
                  Article Info
                </div>
                <div className="text-xs text-white/50">{datePretty}</div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Category</span>

                  <span
                    className="
                      inline-flex items-center
                      px-3 py-1
                      text-[11px] font-semibold uppercase tracking-wider
                      text-white
                      bg-gradient-to-r from-sky-500/90 via-cyan-500/85 to-teal-400/85
                      border border-white/20
                      shadow-[0_0_12px_rgba(56,189,248,0.35)]
                      backdrop-blur-sm
                    "
                  >
                    {row.category}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">Read time</span>
                  <span className="text-white/85">{readMins} min</span>
                </div>

                <div className="h-px bg-white/10" />

                {/* Share */}
                <div>
                  <div className="text-xs text-white/50 mb-2">Share</div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={share.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                    >
                      Share on WhatsApp
                    </a>
                    <a
                      href={share.x}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                    >
                      Share on X
                    </a>
                    <a
                      href={share.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
                    >
                      Share on LinkedIn
                    </a>
                  </div>
                </div>

                {/* ✅ Related / Latest (Top 4) */}
                {relatedSafe.length > 0 ? (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <div className="text-xs text-white/50 mb-2">
                        Latest Articles
                      </div>

                      <div className="flex flex-col gap-3">
                        {relatedSafe.map((r) => {
                          const img = r.coverImage
                            ? proxiedImageSrc(r.coverImage)
                            : "";
                          return (
                            <Link
                              key={r.id}
                              href={`/article/${encodeURIComponent(r.slug)}`}
                              className="group flex gap-3 border border-white/10 bg-black/30 p-2 hover:bg-white/10 transition"
                            >
                              <div className="h-14 w-14 shrink-0 overflow-hidden border border-white/10 bg-black/40">
                                {img ? (
                                  <img
                                    src={img}
                                    alt={r.title}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-[10px] text-white/40">
                                    No image
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="text-[11px] text-white/50">
                                  {r.category}
                                </div>
                                <div className="text-sm text-white/85 leading-snug line-clamp-2 group-hover:text-white">
                                  {r.title}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
