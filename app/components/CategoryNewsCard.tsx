import Link from "next/link";
import { proxiedImageSrc } from "@/src/lib/imageUrl";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  publishedAt: string | null;
  createdAt: string;
  coverImage?: string | null;
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

function estimateReadingTimeMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = 220;
  const mins = Math.ceil(words / wpm);
  return Math.max(1, mins);
}

// kept (harmless) because you may be using it elsewhere,
// but we will NOT use it for the MOBILE title anymore.
function splitTitleTwoLines(title: string) {
  const t = (title || "").trim().replace(/\s+/g, " ");
  if (!t) return { line1: "", line2: "" };

  const words = t.split(" ");
  if (words.length <= 4) return { line1: t, line2: "" };

  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(" "),
    line2: words.slice(mid).join(" "),
  };
}

function formatShortDate(d: string | null | undefined) {
  const raw = d || "";
  const dt = raw ? new Date(raw) : null;
  if (!dt || Number.isNaN(dt.getTime())) return "";
  const day = dt.getDate();
  const month = dt.getMonth() + 1;
  const yy = String(dt.getFullYear()).slice(-2);
  return `${day}/${month}/${yy}`;
}

export default function CategoryNewsCard({ article }: { article: Article }) {
  const ok = hasValidSlug(article);

  const imgSrc =
    hasCoverImage(article) && article.coverImage
      ? proxiedImageSrc(article.coverImage)
      : "";

  const readMins = estimateReadingTimeMinutes(
    `${article.title || ""} ${article.summary || ""}`
  );

  // kept (but NOT used in mobile title now)
  splitTitleTwoLines(article.title);

  const dateText = formatShortDate(article.publishedAt || article.createdAt);

  return (
    <Link
      href={safeArticleHref(article)}
      aria-disabled={!ok}
      className="group block overflow-hidden border border-white/10 bg-[#1b1b1b] transition hover:bg-[#202020]"
      style={{
        pointerEvents: ok ? "auto" : "none",
        opacity: ok ? 1 : 0.55,
      }}
    >
      <div className="flex flex-col md:flex-row md:h-[240px]">
        {/* IMAGE */}
        {/* ✅ Mobile becomes true 4:5 (template), Desktop unchanged */}
        <div className="relative w-full md:w-[420px] aspect-[4/5] md:aspect-auto md:h-full shrink-0 overflow-hidden">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={article.title}
              loading="lazy"
              className="block w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-white/35 bg-black/30">
              No image
            </div>
          )}

          {/* ✅ MOBILE ONLY overlays */}
          <div className="md:hidden pointer-events-none absolute inset-0">
            {/* Bottom dark readability gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            {/* Green low-opacity glow (bottom-right) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(0,140,80,0.40)_0%,rgba(0,140,80,0.0)_62%)]" />

            {/* Layout wrapper */}
            <div className="absolute inset-0 p-4 flex flex-col">
              {/* Top row: logo left, website right */}
              <div className="flex items-start justify-between">
                <img
                  src="/brand/knotshorts-logo.png"
                  alt="KnotShorts"
                  className="-mt-5 -ml-5 h-16 w-auto opacity-95 drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                  loading="lazy"
                />

               <div className="-mt-1 text-[14px] font-medium tracking-wide text-white/90
                drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]
                drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]">

                www.
                <span className="text-[#fffff] text-[16px] font-bold">knotshorts</span>

                .com
                </div>

              </div>

              {/* Bottom stack */}
              <div className="mt-auto space-y-2">
                {/* ✅ Breaking pill moved UP more (visual space increases to title) */}
                <div className="inline-flex items-center bg-[#E63B3B] px-4 py-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.30)] transform -translate-y--2">
                  <span className="[font-family:var(--font-oswald)] text-[clamp(14px,3.6vw,18px)] font-semibold tracking-[0.06em] text-white uppercase leading-none">
                    BREAKING NEWS
                  </span>
                </div>

                {/* ✅ Title: natural wrapping (no forced line split) + better line spacing */}
                <div className="text-white drop-shadow-[0_10px_26px_rgba(0,0,0,0.75)]">
                  <div
                    className="
                      [font-family:var(--font-merriweather)]
                      text-[clamp(22px,5.6vw,34px)]
                      font-normal
                      leading-[1.40]
                      [text-wrap:balance]
                    "
                  >
                    {article.title}
                  </div>
                </div>

                {/* Bottom info bar */}
                <div className="h-11 rounded-xl bg-white/12 backdrop-blur-sm border border-white/10 shadow-[0_10px_22px_rgba(0,0,0,0.30)] flex items-center px-4">
                  <div className="text-[11px] text-white/80">
                    {dateText ? `Date: ${dateText}` : ""}
                  </div>

                  <div className="flex-1 flex justify-center">
                    <div className="text-[13px] font-semibold text-white/90">
                      KnotShorts
                    </div>
                  </div>

                  <img
                    src="/brand/knotshorts-logo.png"
                    alt="KnotShorts"
                    className="h-10 w-10 object-contain opacity-95 drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category tag (DESKTOP ONLY so mobile matches template) */}
          <div className="absolute left-4 top-4 hidden md:block">
            <span
              className="
                inline-flex items-center
                rounded-sm
                px-3 py-1
                text-[11px] font-semibold uppercase tracking-wider
                text-white
                bg-gradient-to-r from-sky-500/90 via-cyan-500/85 to-teal-400/85
                border border-white/20
                shadow-[0_0_12px_rgba(56,189,248,0.35)]
                backdrop-blur-sm
              "
            >
              {article.category}
            </span>
          </div>
        </div>

        {/* DESKTOP ONLY CONTENT (UNCHANGED) */}
        <div className="hidden md:flex flex-1 min-w-0 p-6 h-full flex-col justify-between">
          <div className="min-w-0">
            <h3 className="text-2xl font-medium leading-snug text-white/92 group-hover:text-white transition-colors line-clamp-2">
              {article.title}
            </h3>

            <div className="mt-3 h-[2px] w-12 bg-white/20 group-hover:bg-white/30 transition-colors" />
          </div>

          <div className="min-w-0">
            <div className="text-xs text-white/45">{readMins} min read</div>

            <p className="mt-2 text-[15px] text-white/70 leading-relaxed line-clamp-3">
              {article.summary}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
