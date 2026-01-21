// app/components/NewsContainer3.tsx
import { proxiedImageSrc } from "@/src/lib/imageUrl";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  coverImage?: string | null;
};

export default function NewsContainer3({
  article,
  showSummary = true,
}: {
  article: Article;
  showSummary?: boolean;
}) {
  const href = article?.slug?.trim()
    ? `/article/${article.slug.trim()}`
    : "#";

  const hasImg =
    typeof article?.coverImage === "string" &&
    article.coverImage.trim().length > 0;

  const imgSrc = hasImg ? proxiedImageSrc(article.coverImage!.trim()) : "";

  return (
    <a
      href={href}
      aria-disabled={href === "#"}
      className="block"
      style={{
        pointerEvents: href === "#" ? "none" : "auto",
        opacity: href === "#" ? 0.6 : 1,
      }}
    >
      {/* ✅ Image itself is the container */}
      {imgSrc ? (
        <div className="relative overflow-hidden border border-white/10 bg-black">
          {/* Background image */}
          <img
            src={imgSrc}
            alt={article.title}
            className="w-full h-[360px] sm:h-[460px] md:h-[560px] object-cover"
            loading="lazy"
          />

          {/* Bottom overlay */}
          <div className="absolute inset-0 flex items-end">
            {/* ✅ Pink gradient: solid bottom → transparent top */}
            <div
              className="absolute inset-x-0 bottom-0 h-[68%]"
              style={{
                background:
                  "linear-gradient(to top, rgba(232,136,115,1) 0%, rgba(232,136,115,0.95) 18%, rgba(232,136,115,0.6) 55%, rgba(232,136,115,0) 100%)",
              }}
            />

            {/* Text */}
            <div className="relative z-10 w-full p-5 sm:p-7 md:p-10 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                {article.title}
              </h2>

              {showSummary && article.summary?.trim() ? (
                <p
                  className="
                    mt-3
                    text-sm sm:text-base
                    text-white/90
                    leading-relaxed
                    max-w-3xl mx-auto
                    line-clamp-2
                    sm:line-clamp-3
                  "
                >
                  {article.summary}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-[360px] sm:h-[460px] md:h-[560px] flex items-center justify-center border border-white/10 bg-white/5 text-white/40 text-sm">
          No image
        </div>
      )}
    </a>
  );
}
