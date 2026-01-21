// app/components/SpotlightArticles.tsx
import { proxiedImageSrc } from "@/src/lib/imageUrl";

type Article = {
  id: string;
  title: string;
  slug: string;

  summary?: string | null;
  category?: string | null;

  coverImage?: string | null;

  publishedAt?: string | null;
  createdAt?: string | null;
};

function hasValidSlug(a: Article) {
  return typeof a?.slug === "string" && a.slug.trim().length > 0;
}

function safeArticleHref(a: Article) {
  return hasValidSlug(a) ? `/article/${a.slug.trim()}` : "#";
}

function hasCoverImage(a: Article) {
  return typeof a?.coverImage === "string" && a.coverImage.trim().length > 0;
}

function getImgSrc(a: Article) {
  return hasCoverImage(a) && a.coverImage ? proxiedImageSrc(a.coverImage.trim()) : "";
}

function timeAgoLabel(iso?: string | null) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";

  const diffMs = Date.now() - t;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Spotlight Articles block:
 * - 1 main (index 0)
 * - 2 bottom (index 1..2)
 */
export default function SpotlightArticles({ articles }: { articles: Article[] }) {
  if (!Array.isArray(articles) || articles.length !== 3) return null;

  const main = articles[0];
  const bottom = articles.slice(1, 3);

  const mainOk = hasValidSlug(main);
  const mainHref = safeArticleHref(main);
  const mainImg = getImgSrc(main);

  return (
    <section className="w-full">
      {/* TOP: Main card (dark, left text, right image) */}
      <a
        href={mainHref}
        aria-disabled={!mainOk}
        className="block"
        style={{
          pointerEvents: mainOk ? "auto" : "none",
          opacity: mainOk ? 1 : 0.55,
        }}
      >
        <div className="bg-[#1f1f1f] border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left */}
            <div className="p-6 sm:p-8 md:p-10">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  SPOTLIGHT
                </span>

                {(() => {
                  const label = timeAgoLabel(main.publishedAt ?? main.createdAt);
                  return label ? (
                    <>
                      <span className="text-white/35">|</span>
                      <span className="uppercase tracking-wide">{label}</span>
                    </>
                  ) : null;
                })()}
              </div>

              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white">
                {main.title}
              </h2>

              {main.summary?.trim() ? (
                <p className="mt-4 text-sm sm:text-base md:text-[20px] text-white/85 leading-relaxed line-clamp-3">
                  {main.summary}
                </p>
              ) : null}

              {main.category?.trim() ? (
                <div className="mt-6">
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                    {main.category}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Right */}
            <div className="relative min-h-[240px] sm:min-h-[280px] md:min-h-[360px]">
              {mainImg ? (
                <img
                  src={mainImg}
                  alt={main.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
                  No image
                </div>
              )}
            </div>
          </div>
        </div>
      </a>

      {/* BOTTOM: 2 small cards with thumbnail + title */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {bottom.map((a, idx) => {
          const ok = hasValidSlug(a);
          const href = safeArticleHref(a);
          const img = getImgSrc(a);
          const label = timeAgoLabel(a.publishedAt ?? a.createdAt);

          return (
            <a
              key={a.id || idx}
              href={href}
              aria-disabled={!ok}
              className="block border border-white/10"
              style={{
                pointerEvents: ok ? "auto" : "none",
                opacity: ok ? 1 : 0.6,
              }}
            >
              <div className="h-full bg-[#2a2a2a] hover:bg-[#303030] transition-colors p-4 sm:p-5 flex gap-4 items-center">
                {/* Thumb */}
                <div className="w-[110px] h-[64px] shrink-0 overflow-hidden border border-white/10 bg-black/30">
                  {img ? (
                    <img
                      src={img}
                      alt={a.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/35 text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/80">
                    <span className="text-orange-300">Analysis</span>
                    {label ? (
                      <>
                        <span className="text-white/35">/</span>
                        <span className="text-white/70">{label}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-1 text-sm sm:text-base font-extrabold leading-snug text-white line-clamp-2">
                    {a.title}
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
