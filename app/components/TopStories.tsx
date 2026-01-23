"use client";

import { useEffect, useMemo, useState } from "react";
import { proxiedImageSrc } from "@/src/lib/imageUrl";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  featured: number;
  breaking: number;
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

export default function TopStories({ featured }: { featured: Article[] }) {
  const items = useMemo(() => featured.filter(hasValidSlug), [featured]);

  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      const t = setTimeout(() => {
        setIdx((p) => (p + 1) % items.length);
        setFade(true);
      }, 280);
      return () => clearTimeout(t);
    }, 4500);

    return () => clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) return null;

  const hero = items[idx];
  const rest = items.filter((_, i) => i !== idx);
  const heroImg = hasCoverImage(hero) ? proxiedImageSrc(hero.coverImage) : "";

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Top Stories</h2>
        <span className="text-xs text-white/50">{items.length} featured</span>
      </div>

      {/* HERO */}
      <a
        href={safeArticleHref(hero)}
        className="group block border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden"
      >
        <div
          className={`grid grid-cols-1 md:grid-cols-[420px_1fr] ${
            fade ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
        >
          <div className="relative">
            {heroImg ? (
              <>
                <img
                  src={heroImg}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
                  aria-hidden
                />
                <img
                  src={heroImg}
                  alt={hero.title}
                  className="relative z-10 w-full h-[220px] md:h-[280px] object-contain"
                  loading="lazy"
                />
              </>
            ) : (
              <div className="w-full h-[220px] md:h-[280px] bg-white/5" />
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          <div className="p-4 md:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide ${categoryBadgeClass(
                  hero.category
                )}`}
              >
                {hero.category}
              </span>
              {hero.breaking === 1 && (
                <>
                  <span className="w-[2px] h-4 bg-red-600" />
                  <span className="px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide bg-red-600 text-white">
                    Breaking
                  </span>
                </>
              )}
            </div>

            <div className="text-lg md:text-2xl font-bold leading-snug group-hover:underline">
              {hero.title}
            </div>

            <p className="mt-3 text-sm md:text-base text-white/70 line-clamp-4">
              {hero.summary}
            </p>
          </div>
        </div>
      </a>

      {/* THREE SMALL CARDS */}
      {rest.length > 0 && (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.slice(0, 3).map((a) => {
            const imgSrc = hasCoverImage(a) ? proxiedImageSrc(a.coverImage) : "";

            return (
              <a
                key={a.id}
                href={safeArticleHref(a)}
                className="group border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden"
              >
                {/* EDGE-TO-EDGE IMAGE WITH BLUR FILL */}
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

                {/* CONTENT */}
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs">
                    <span
                      className={`px-2 py-[3px] text-[11px] font-semibold uppercase tracking-wide ${categoryBadgeClass(
                        a.category
                      )}`}
                    >
                      {a.category}
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
    </section>
  );
}
