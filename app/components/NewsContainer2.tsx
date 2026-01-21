import { proxiedImageSrc } from "@/src/lib/imageUrl";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage?: string | null;
};

export default function NewsContainer2({
  article,
}: {
  article: Article;
}) {
  if (!article) return null;

  const hasImage =
    typeof article.coverImage === "string" &&
    article.coverImage.trim().length > 0;

  const imageSrc = hasImage
    ? proxiedImageSrc(article.coverImage as string)
    : "";

  return (
    <section className="w-full bg-[#1a1a1a] py-10">
      <div className="mx-auto max-w-4xl px-4 text-center">
        {/* Headline */}
        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
          {article.title}
        </h2>

        {/* Optional summary */}
        {article.summary ? (
          <p className="mt-4 text-base md:text-lg text-white/80 leading-relaxed">
            {article.summary}
          </p>
        ) : null}

        {/* Image */}
        {hasImage ? (
          <div className="mt-8">
            <img
              src={imageSrc}
              alt={article.title}
              className="w-full max-h-[520px] object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
