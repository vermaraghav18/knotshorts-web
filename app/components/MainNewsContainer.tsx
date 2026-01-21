import { proxiedImageSrc } from "@/src/lib/imageUrl";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
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

export default function MainNewsContainer({ article }: { article: Article }) {
  const ok = hasValidSlug(article);

  const imgSrc =
    hasCoverImage(article) && article.coverImage
      ? proxiedImageSrc(article.coverImage)
      : "";

  return (
    <a
      href={safeArticleHref(article)}
      aria-disabled={!ok}
      className="group block"
      style={{
        pointerEvents: ok ? "auto" : "none",
        opacity: ok ? 1 : 0.55,
      }}
    >
      {/* ✅ bg dark grey, no container, no rounded corners */}
      <div className="bg-[#1f1f1f]">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left */}
          <div className="p-8 md:p-10">
            {/* ✅ title red */}
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-red-500">
              {article.title}
            </h2>

            {/* ✅ summary white */}
            <p className="mt-4 text-sm md:text-[21px] text-white leading-relaxed">
              {article.summary}
            </p>

            {/* keep category pill as-is (unchanged) */}
            <div className="mt-6">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                {article.category}
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="relative min-h-[260px] md:min-h-[360px]">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={article.title}
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
  );
}
