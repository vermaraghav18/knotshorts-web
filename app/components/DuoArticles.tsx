// app/components/DuoArticles.tsx
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
  return hasCoverImage(a) && a.coverImage
    ? proxiedImageSrc(a.coverImage.trim())
    : "";
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
 * Duo Articles block (2 articles):
 * - Left: title -> image -> summary (clean, editorial)
 * - Right: full-image card with bottom gradient + title/summary overlay
 */
export default function DuoArticles({ articles }: { articles: Article[] }) {
  if (!Array.isArray(articles) || articles.length !== 2) return null;

  const left = articles[0];
  const right = articles[1];

  const leftOk = hasValidSlug(left);
  const rightOk = hasValidSlug(right);

  const leftHref = safeArticleHref(left);
  const rightHref = safeArticleHref(right);

  const leftImg = getImgSrc(left);
  const rightImg = getImgSrc(right);

  const leftLabel = timeAgoLabel(left.publishedAt ?? left.createdAt);
  const rightLabel = timeAgoLabel(right.publishedAt ?? right.createdAt);

  return (
    <section className="w-full border border-white/10 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* LEFT ARTICLE: title + image + summary */}
        <a
          href={leftHref}
          aria-disabled={!leftOk}
          className="block border-b md:border-b-0 md:border-r border-black/10"
          style={{
            pointerEvents: leftOk ? "auto" : "none",
            opacity: leftOk ? 1 : 0.55,
          }}
        >
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs text-black/60">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-black/80" />
                DUO
              </span>
              {leftLabel ? (
                <>
                  <span className="text-black/25">|</span>
                  <span className="uppercase tracking-wide">{leftLabel}</span>
                </>
              ) : null}
            </div>

            <h3 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-black line-clamp-3">
              {left.title}
            </h3>

            <div className="mt-5">
              {leftImg ? (
                <div className="overflow-hidden border border-black/10 bg-black/5">
                  <img
                    src={leftImg}
                    alt={left.title}
                    className="w-full h-[210px] md:h-[240px] object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="h-[210px] md:h-[240px] border border-black/10 bg-black/10 flex items-center justify-center text-black/50 text-sm">
                  No image
                </div>
              )}
            </div>

            {left.summary?.trim() ? (
              <p className="mt-5 text-base md:text-lg text-black/80 leading-relaxed line-clamp-4">
                {left.summary}
              </p>
            ) : (
              <p className="mt-5 text-base md:text-lg text-black/50 leading-relaxed">
                &nbsp;
              </p>
            )}

            {left.category?.trim() ? (
              <div className="mt-5">
                <span className="inline-flex items-center rounded-full border border-black/15 bg-black/5 px-3 py-1 text-xs text-black/70">
                  {left.category}
                </span>
              </div>
            ) : null}
          </div>
        </a>

        {/* RIGHT ARTICLE: full image with bottom gradient overlay */}
        <a
          href={rightHref}
          aria-disabled={!rightOk}
          className="block"
          style={{
            pointerEvents: rightOk ? "auto" : "none",
            opacity: rightOk ? 1 : 0.55,
          }}
        >
          <div className="relative min-h-[380px] md:min-h-[520px] bg-black/5 overflow-hidden">
            {rightImg ? (
              <img
                src={rightImg}
                alt={right.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-black/50 text-sm">
                No image
              </div>
            )}

            {/* bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-white via-white/95 to-white/0" />

            {/* ✅ FULL-HEIGHT overlay + flex justify-end = text pinned to bottom edge */}
            <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-8 pb-4 md:pb-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-black/60">
                <span className="font-semibold">Featured</span>
                {rightLabel ? (
                  <>
                    <span className="text-black/25">/</span>
                    <span>{rightLabel}</span>
                  </>
                ) : null}
              </div>

              <h3 className="mt-1 text-xl md:text-2xl font-extrabold leading-snug text-black line-clamp-3">
                {right.title}
              </h3>

              {right.summary?.trim() ? (
                <p className="mt-1 text-sm md:text-base text-black/70 leading-relaxed line-clamp-3">
                  {right.summary}
                </p>
              ) : null}
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}
