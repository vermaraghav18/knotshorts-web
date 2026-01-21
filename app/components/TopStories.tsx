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
      return "bg-gradient-to-r from-blue-500 to-cyan-400 text-white border-transparent";
    case "Entertainment":
      return "bg-purple-500/20 text-purple-200 border-purple-400/30";
    case "India":
      return "bg-orange-500/20 text-orange-200 border-orange-400/30";
    case "Business":
      return "bg-green-500/20 text-green-200 border-green-400/30";
    case "Sports":
      return "bg-yellow-400/20 text-yellow-200 border-yellow-300/30";
    case "Technology":
      return "bg-sky-400/20 text-sky-200 border-sky-300/30";
    case "Health":
      return "bg-black/40 text-white/85 border-white/15";
    case "Lifestyle":
      return "bg-teal-500/20 text-teal-200 border-teal-400/30";
    default:
      return "bg-white/5 text-white/70 border-white/15";
  }
}

export default function TopStories({ featured }: { featured: Article[] }) {
  const items = useMemo(() => featured.filter(hasValidSlug), [featured]);

  // hero index + fade state
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      // fade out
      setFade(false);

      // after fade-out, switch item then fade in
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
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Top Stories</h2>
        <span className="text-xs text-white/50">{items.length} featured</span>
      </div>

      {/* ✅ HERO (image left, content right) */}
      <a
        href={safeArticleHref(hero)}
        className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition overflow-hidden"
      >
        <div
          className={`grid grid-cols-1 md:grid-cols-[420px_1fr] ${
            fade ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
        >
          {/* Left image */}
          <div className="relative">
            {heroImg ? (
              <img
                src={heroImg}
                alt={hero.title}
                className="w-full h-[220px] md:h-[280px] object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-[220px] md:h-[280px] bg-white/5" />
            )}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          {/* Right content */}
          <div className="p-4 md:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full border px-2 py-1 ${categoryBadgeClass(
                  hero.category
                )}`}
              >
                {hero.category}
              </span>

              {hero.breaking === 1 ? (
                <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-200">
                  Breaking
                </span>
              ) : null}
            </div>

            <div className="text-lg md:text-2xl font-bold leading-snug group-hover:underline">
              {hero.title}
            </div>

            <p className="mt-3 text-sm md:text-base leading-relaxed text-white/70 line-clamp-4">
              {hero.summary}
            </p>

            <div className="mt-4 text-xs text-white/40">
              Auto-rotating top story
            </div>
          </div>
        </div>
      </a>

      {/* ✅ REST CARDS BELOW */}
      {rest.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.slice(0, 6).map((a) => {
            const imgSrc = hasCoverImage(a) ? proxiedImageSrc(a.coverImage) : "";

            return (
              <a
                key={a.id}
                href={safeArticleHref(a)}
                className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                {imgSrc ? (
                  <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    <img
                      src={imgSrc}
                      alt={a.title}
                      className="w-full h-[140px] object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full border px-2 py-1 ${categoryBadgeClass(
                      a.category
                    )}`}
                  >
                    {a.category}
                  </span>
                  {a.breaking === 1 ? (
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-200">
                      Breaking
                    </span>
                  ) : null}
                </div>

                <div className="text-base font-semibold leading-snug group-hover:underline line-clamp-2">
                  {a.title}
                </div>
                <p className="mt-2 text-sm text-white/60 line-clamp-2">
                  {a.summary}
                </p>
              </a>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
