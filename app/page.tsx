export const dynamic = "force-dynamic";

import { headers } from "next/headers";

import { proxiedImageSrc } from "@/src/lib/imageUrl";
import TopStories from "@/app/components/TopStories";
import MainNewsContainer from "@/app/components/MainNewsContainer";
import NewsContainer2 from "@/app/components/NewsContainer2";
import NewsContainer3 from "@/app/components/NewsContainer3";
import ClubArticles from "@/app/components/ClubArticles";
import SpotlightArticles from "@/app/components/SpotlightArticles";
import DuoArticles from "@/app/components/DuoArticles";

import type { ClubArticlesConfig, ClubPosition } from "@/src/lib/clubArticles";
import type {
  SpotlightArticlesConfig,
  SpotlightPosition,
} from "@/src/lib/spotlightArticles";
import type { DuoArticlesConfig, DuoPosition } from "@/src/lib/duoArticles";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  status: "draft" | "published";
  featured: number;
  breaking: number;

  ticker: number;

  mainHero?: number;
  mainHeroSlot?: string | null;

  hero2?: number;
  hero2Slot?: string | null;

  hero3?: number;
  hero3Slot?: string | null;

  publishedAt: string | null;
  createdAt: string;
  coverImage?: string | null;
};

// ✅ FIX 1: headers() is async in your Next version
async function getBaseUrl() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/**
 * ✅ FIX 2: Server Components should fetch absolute URL reliably
 * (relative "/api/..." can return null/empty in server runtime)
 */
async function safeFetchJson<T>(
  baseUrl: string,
  path: string
): Promise<T | null> {
  try {
    const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getArticles(baseUrl: string): Promise<Article[]> {
  const json = await safeFetchJson<{ ok: boolean; articles: Article[] }>(
    baseUrl,
    "/api/articles"
  );
  return json?.articles || [];
}

async function getClubConfig(
  baseUrl: string
): Promise<ClubArticlesConfig | null> {
  const json = await safeFetchJson<{ ok: boolean; config: ClubArticlesConfig }>(
    baseUrl,
    "/api/club-articles"
  );
  return json?.config || null;
}

async function getSpotlightConfig(
  baseUrl: string
): Promise<SpotlightArticlesConfig | null> {
  const json = await safeFetchJson<{
    ok: boolean;
    config: SpotlightArticlesConfig;
  }>(baseUrl, "/api/spotlight-articles");
  return json?.config || null;
}

async function getDuoConfig(baseUrl: string): Promise<DuoArticlesConfig | null> {
  const json = await safeFetchJson<{ ok: boolean; config: DuoArticlesConfig }>(
    baseUrl,
    "/api/duo-articles"
  );
  return json?.config || null;
}

function groupByCategory(articles: Article[]) {
  const map = new Map<string, Article[]>();
  for (const a of articles) {
    if (!map.has(a.category)) map.set(a.category, []);
    map.get(a.category)!.push(a);
  }
  return map;
}

// ✅ Helper: guard slug
function hasValidSlug(a: Article) {
  return typeof a?.slug === "string" && a.slug.trim().length > 0;
}

// ✅ Helper: safe href builder
function safeArticleHref(a: Article) {
  return hasValidSlug(a) ? `/article/${a.slug.trim()}` : "#";
}

// ✅ Helper: cover image guard
function hasCoverImage(a: Article) {
  return typeof a?.coverImage === "string" && a.coverImage.trim().length > 0;
}

/** ✅ Category tag colors (rectangular newsroom tags) */
function categoryBadgeClass(category: string) {
  switch (category) {
    case "World":
      return "bg-cyan-500 text-white";
    case "Entertainment":
      return "bg-purple-600 text-white";
    case "India":
      return "bg-orange-500 text-white";
    case "Business":
      return "bg-green-600 text-white";
    case "Sports":
      return "bg-yellow-500 text-black";
    case "Technology":
      return "bg-blue-600 text-white";
    case "Health":
      return "bg-emerald-600 text-white";
    case "Lifestyle":
      return "bg-pink-500 text-white";
    default:
      return "bg-zinc-700 text-white";
  }
}

function clubKeyForCategory(cat: string): ClubPosition {
  return `after_${cat.toLowerCase()}_section` as ClubPosition;
}

function spotlightKeyForCategory(cat: string): SpotlightPosition {
  return `after_${cat.toLowerCase()}_section` as SpotlightPosition;
}

function duoKeyForCategory(cat: string): DuoPosition {
  return `after_${cat.toLowerCase()}_section` as DuoPosition;
}

export default async function HomePage() {
  const baseUrl = await getBaseUrl();

  const [all, clubConfig, spotlightConfig, duoConfig] = await Promise.all([
    getArticles(baseUrl),
    getClubConfig(baseUrl),
    getSpotlightConfig(baseUrl),
    getDuoConfig(baseUrl),
  ]);

  // ✅ Only published AND slug-present on public site
  const published = all
    .filter((a) => a.status === "published")
    .filter((a) => hasValidSlug(a));

  // Sort newest first (publishedAt fallback createdAt)
  published.sort((a, b) => {
    const ad = new Date(a.publishedAt || a.createdAt).getTime();
    const bd = new Date(b.publishedAt || b.createdAt).getTime();
    return bd - ad;
  });

  // ✅ Club Articles resolved list
  const clubPosition = (clubConfig?.position || null) as ClubPosition | null;
  let clubArticles: Article[] | null = null;

  if (clubConfig?.articleIds?.length === 5) {
    const byId = new Map<string, Article>();
    for (const a of published) byId.set(a.id, a);

    const ordered = clubConfig.articleIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Article[];

    if (ordered.length === 5) clubArticles = ordered;
  }

  // ✅ Spotlight Articles resolved list
  const spotlightPosition = (spotlightConfig?.position ||
    null) as SpotlightPosition | null;
  let spotlightArticles: Article[] | null = null;

  if (spotlightConfig?.articleIds?.length === 3) {
    const byId = new Map<string, Article>();
    for (const a of published) byId.set(a.id, a);

    const ordered = spotlightConfig.articleIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Article[];

    if (ordered.length === 3) spotlightArticles = ordered;
  }

  // ✅ Duo Articles resolved list
  const duoPosition = (duoConfig?.position || null) as DuoPosition | null;
  let duoArticles: Article[] | null = null;

  if (duoConfig?.articleIds?.length === 2) {
    const byId = new Map<string, Article>();
    for (const a of published) byId.set(a.id, a);

    const ordered = duoConfig.articleIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Article[];

    if (ordered.length === 2) duoArticles = ordered;
  }

  // ✅ Main News Container: pick one article per slot
  const mainHeroBySlot: Record<string, Article | undefined> = {};
  for (const a of published) {
    if (Number(a.mainHero || 0) === 1 && a.mainHeroSlot) {
      if (!mainHeroBySlot[a.mainHeroSlot]) mainHeroBySlot[a.mainHeroSlot] = a;
    }
  }

  // ✅ News Container 2: pick one article per slot
  const hero2BySlot: Record<string, Article | undefined> = {};
  for (const a of published) {
    if (Number(a.hero2 || 0) === 1 && a.hero2Slot) {
      if (!hero2BySlot[a.hero2Slot]) hero2BySlot[a.hero2Slot] = a;
    }
  }

  // ✅ News Container 3: pick one article per slot
  const hero3BySlot: Record<string, Article | undefined> = {};
  for (const a of published) {
    if (Number(a.hero3 || 0) === 1 && a.hero3Slot) {
      if (!hero3BySlot[a.hero3Slot]) hero3BySlot[a.hero3Slot] = a;
    }
  }

  // ✅ Ticker items list
  const tickerItems = published.filter((a) => a.ticker === 1).slice(0, 12);

  const byCat = groupByCategory(published);

  const sections = [
    "World",
    "India",
    "Business",
    "Technology",
    "Entertainment",
    "Sports",
    "Health",
    "Lifestyle",
  ];

  // ✅ Featured used for Top Stories
  const featured = published.filter((a) => a.featured === 1).slice(0, 4);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ✅ Ticker bar */}
      {tickerItems.length > 0 ? (
        <div className="border-b border-white/10 bg-red-600">
          <div className="mx-auto max-w-6xl px-4 py-[2px] overflow-hidden">
            <div className="ks-ticker">
              <div className="ks-ticker-track">
                {[...tickerItems, ...tickerItems].map((a, idx) => (
                  <a
                    key={`${a.id}-${idx}`}
                    href={safeArticleHref(a)}
                    className="ks-ticker-item"
                    title={a.title}
                  >
                    <span className="ks-ticker-dot">•</span>
                    {a.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-6xl px-4 pt-2 pb-8">
        {/* ✅ If nothing published yet, show a friendly placeholder */}
        {published.length === 0 ? (
          <div className="rounded-none border border-white/10 bg-white/5 p-6 text-white/70">
            No published articles yet. Publish at least 1 article (Status =
            Published) to populate the homepage.
          </div>
        ) : null}

        {/* ✅ Main News (slot: after_insta_strip) */}
        {mainHeroBySlot["after_insta_strip"] ? (
          <div className="mt-6">
            <MainNewsContainer article={mainHeroBySlot["after_insta_strip"]!} />
          </div>
        ) : null}

        {/* ✅ Container 2 (slot: after_insta_strip) */}
        {hero2BySlot["after_insta_strip"] ? (
          <div className="mt-6">
            <NewsContainer2 article={hero2BySlot["after_insta_strip"]!} />
          </div>
        ) : null}

        {/* ✅ Container 3 (slot: after_insta_strip) */}
        {hero3BySlot["after_insta_strip"] ? (
          <div className="mt-6">
            <NewsContainer3 article={hero3BySlot["after_insta_strip"]!} />
          </div>
        ) : null}

        {/* ✅ Top Stories */}
        <TopStories featured={featured} />

        {/* ✅ Spotlight after top stories */}
        {spotlightArticles && spotlightPosition === "after_top_stories" ? (
          <div className="mt-6">
            <SpotlightArticles articles={spotlightArticles} />
          </div>
        ) : null}

        {/* ✅ Duo after top stories */}
        {duoArticles && duoPosition === "after_top_stories" ? (
          <div className="mt-6">
            <DuoArticles articles={duoArticles} />
          </div>
        ) : null}

        {/* ✅ Club after top stories */}
        {clubArticles && clubPosition === "after_top_stories" ? (
          <div className="mt-6">
            <ClubArticles articles={clubArticles} />
          </div>
        ) : null}

        {/* ✅ Main News (slot: after_top_stories) */}
        {mainHeroBySlot["after_top_stories"] ? (
          <div className="mt-6">
            <MainNewsContainer article={mainHeroBySlot["after_top_stories"]!} />
          </div>
        ) : null}

        {/* ✅ Container 2 (slot: after_top_stories) */}
        {hero2BySlot["after_top_stories"] ? (
          <div className="mt-6">
            <NewsContainer2 article={hero2BySlot["after_top_stories"]!} />
          </div>
        ) : null}

        {/* ✅ Container 3 (slot: after_top_stories) */}
        {hero3BySlot["after_top_stories"] ? (
          <div className="mt-6">
            <NewsContainer3 article={hero3BySlot["after_top_stories"]!} />
          </div>
        ) : null}

        {/* Category Sections */}
        <div className="space-y-12">
          {sections.map((cat) => {
            const items = byCat.get(cat) || [];
            if (items.length === 0) return null;

            const main = items[0];
            const small = items.slice(1, 4);

            const mainOk = hasValidSlug(main);
            const mainImgSrc =
              hasCoverImage(main) && main.coverImage
                ? proxiedImageSrc(main.coverImage)
                : "";

            const clubKey = clubKeyForCategory(cat);
            const spotlightKey = spotlightKeyForCategory(cat);
            const duoKey = duoKeyForCategory(cat);

            return (
              <section key={cat} id={`cat-${cat.toLowerCase()}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">{cat}</h2>
                  <span className="text-xs text-white/50">
                    {items.length} stories
                  </span>
                </div>

                {/* ✅ Make category containers EXACTLY like TopStories */}
                <div className="space-y-4">
                 {/* HERO — match TopStories HERO exactly */}
<a
  href={safeArticleHref(main)}
  aria-disabled={!mainOk}
  className="group block border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden"
  style={{
    pointerEvents: mainOk ? "auto" : "none",
    opacity: mainOk ? 1 : 0.55,
  }}
>
  <div className="grid grid-cols-1 md:grid-cols-[420px_1fr]">
    {/* Image block (TopStories exact) */}
    <div className="relative">
      {mainImgSrc ? (
        <>
          {/* Blur fill background */}
          <img
            src={mainImgSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
            aria-hidden
          />

          {/* Foreground image (NO CROP) */}
          <img
            src={mainImgSrc}
            alt={main.title}
            className="relative z-10 w-full h-[220px] md:h-[280px] object-contain"
            loading="lazy"
          />
        </>
      ) : (
        <div className="w-full h-[220px] md:h-[280px] bg-white/5" />
      )}

      {/* Contrast overlay (TopStories exact) */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>

    {/* Content block (TopStories exact spacing/typography) */}
    <div className="p-4 md:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide ${categoryBadgeClass(
            cat
          )}`}
        >
          {cat}
        </span>

        {main.breaking === 1 && (
          <>
            <span className="w-[2px] h-4 bg-red-600" />
            <span className="px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide bg-red-600 text-white">
              Breaking
            </span>
          </>
        )}
      </div>

      <div className="text-lg md:text-2xl font-bold leading-snug group-hover:underline">
        {main.title}
      </div>

      <p className="mt-3 text-sm md:text-base text-white/70 line-clamp-4">
        {main.summary}
      </p>
    </div>
  </div>
</a>


                  {/* THREE SMALL CARDS */}
                  {small.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {small.map((a) => {
                        const ok = hasValidSlug(a);
                        const imgSrc =
                          hasCoverImage(a) && a.coverImage
                            ? proxiedImageSrc(a.coverImage)
                            : "";

                        return (
                          <a
                            key={a.id}
                            href={safeArticleHref(a)}
                            aria-disabled={!ok}
                            className="group border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden"
                            style={{
                              pointerEvents: ok ? "auto" : "none",
                              opacity: ok ? 1 : 0.55,
                            }}
                          >
                            <div className="relative h-[170px] w-full">
                              {imgSrc ? (
                                <>
                                  <img
                                    src={imgSrc}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
                                    aria-hidden
                                  />
                                  <img
                                    src={imgSrc}
                                    alt={a.title}
                                    className="relative z-10 w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                </>
                              ) : (
                                <div className="absolute inset-0 bg-white/5" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            </div>

                            <div className="p-4">
                              <div className="mb-2 flex items-center gap-2 text-xs">
                                <span
                                  className={`px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide ${categoryBadgeClass(
                                    cat
                                  )}`}
                                >
                                  {cat}
                                </span>

                                {a.breaking === 1 && (
                                  <>
                                    <span className="w-[2px] h-4 bg-red-600" />
                                    <span className="px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide bg-red-600 text-white">
                                      Breaking
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="text-base font-semibold leading-snug group-hover:underline line-clamp-2">
                                {a.title}
                              </div>

                              <p className="mt-2 text-sm text-white/65 leading-relaxed line-clamp-3 md:line-clamp-4">
                                {a.summary}
                              </p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Container 2/3/Main for India section slots */}
                {cat === "India" && hero2BySlot["after_india_section"] ? (
                  <div className="mt-6">
                    <NewsContainer2
                      article={hero2BySlot["after_india_section"]!}
                    />
                  </div>
                ) : null}

                {cat === "India" && hero3BySlot["after_india_section"] ? (
                  <div className="mt-6">
                    <NewsContainer3
                      article={hero3BySlot["after_india_section"]!}
                    />
                  </div>
                ) : null}

                {cat === "India" && mainHeroBySlot["after_india_section"] ? (
                  <div className="mt-6">
                    <MainNewsContainer
                      article={mainHeroBySlot["after_india_section"]!}
                    />
                  </div>
                ) : null}

                {/* Duo / Spotlight / Club positions */}
                {duoArticles && duoPosition === duoKey ? (
                  <div className="mt-6">
                    <DuoArticles articles={duoArticles} />
                  </div>
                ) : null}

                {spotlightArticles && spotlightPosition === spotlightKey ? (
                  <div className="mt-6">
                    <SpotlightArticles articles={spotlightArticles} />
                  </div>
                ) : null}

                {clubArticles && clubPosition === clubKey ? (
                  <div className="mt-6">
                    <ClubArticles articles={clubArticles} />
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto max-w-6xl px-4 text-sm text-white/50">
          © {new Date().getFullYear()} KnotShorts • All rights reserved.
        </div>
      </footer>
    </div>
  );
}
