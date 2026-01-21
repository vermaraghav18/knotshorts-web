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

export default function CategoryNewsCard({ article }: { article: Article }) {
  const ok = hasValidSlug(article);

  const imgSrc =
    hasCoverImage(article) && article.coverImage
      ? proxiedImageSrc(article.coverImage)
      : "";

  const readMins = estimateReadingTimeMinutes(
    `${article.title || ""} ${article.summary || ""}`
  );

  const { line1, line2 } = splitTitleTwoLines(article.title);

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
        <div className="relative w-full md:w-[420px] h-[320px] md:h-full shrink-0 overflow-hidden">
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

          {/* ✅ Mobile only vignette (SHORTER, bottom-only) */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 md:hidden bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

          {/* Category tag */}
          <div className="absolute left-4 top-4">
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

          {/* MOBILE ONLY: logo + centered title */}
          <div className="md:hidden absolute inset-x-0 bottom-0 pb-3">
            <div className="flex flex-col items-center gap-2">
              <img
                src="/brand/knotshorts-logo-1080-2.png"
                alt="KnotShorts"
                className="h-8 w-auto opacity-95 shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
                loading="lazy"
              />

              {line1 && (
                <div className="flex justify-center px-3 w-full">
                  <div className="bg-[#FB2C36]/95 px-4 py-2 w-fit max-w-[92%] text-center shadow-[0_8px_18px_rgba(0,0,0,0.50)]">
                    <div className="text-[17px] font-extrabold leading-snug text-white break-words">
                      {line1}
                    </div>
                  </div>
                </div>
              )}

              {line2 && (
                <div className="w-full px-4 text-center">
                  <div className="text-[16px] font-bold leading-snug text-white drop-shadow-[0_6px_14px_rgba(0,0,0,0.70)] break-words">
                    {line2}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP ONLY CONTENT */}
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
