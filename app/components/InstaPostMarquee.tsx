import React from "react";

type ArticleLite = {
  id: string;
  slug: string;
  title: string;
};

export default function InstaPostMarquee({
  articles,
  speedSeconds = 34,
  title = "Latest Posts",
}: {
  articles: ArticleLite[];
  speedSeconds?: number;
  title?: string;
}) {
  if (!articles || articles.length === 0) return null;

  // Duplicate to create a seamless loop (CSS animation moves by -50%)
  const loop = [...articles, ...articles];

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-white/80">
          {title}
        </h2>
        <span className="text-xs text-white/40">Auto-generated IG cards</span>
      </div>

      <div className="ks-post-wrap relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/85 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/85 to-transparent z-10" />

        <div
          className="ks-post-track flex gap-4 px-4 py-4"
          style={{ animationDuration: `${speedSeconds}s` }}
        >
          {loop.map((a, idx) => (
            <a
              key={`${a.id}-${idx}`}
              href={`/article/${encodeURIComponent(a.slug)}`}
              className="group shrink-0"
              title={a.title}
            >
              <div className="relative h-[150px] w-[150px] sm:h-[180px] sm:w-[180px] md:h-[210px] md:w-[210px] overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg">
                <img
                  src={`/api/insta?id=${encodeURIComponent(a.id)}`}
                  alt={a.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading={idx < 6 ? "eager" : "lazy"}
                />
              </div>

              <div className="mt-2 max-w-[210px] text-xs text-white/70 line-clamp-2 group-hover:text-white">
                {a.title}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
