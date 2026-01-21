"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/src/lib/categories";

export default function SiteHeader() {
  const router = useRouter();
  const primary = CATEGORIES.slice(0, 5);

  const [q, setQ] = useState("");

  const canSearch = q.trim().length >= 2;

  const searchHref = useMemo(() => {
    const query = q.trim();
    return query.length >= 2 ? `/search?q=${encodeURIComponent(query)}` : "/search";
  }, [q]);

  function submitSearch() {
    const query = q.trim();
    if (query.length < 2) {
      // If user clicks without enough chars, still take them to search page
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 ks-fadeup">
          <div className="relative h-10 w-10 md:h-11 md:w-11 shrink-0">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,70,170,0.45), rgba(140,90,255,0.30), rgba(255,160,60,0.18), transparent 72%)",
                filter: "blur(16px)",
                opacity: 1,
              }}
            />

            <Image
              src="/knotshorts-logo.png"
              alt="KnotShorts"
              fill
              priority
              className="relative z-10 rounded-2xl object-contain"
              style={{
                filter:
                  "drop-shadow(0 0 18px rgba(255,70,170,0.65)) drop-shadow(0 0 30px rgba(140,90,255,0.45)) drop-shadow(0 0 40px rgba(255,160,60,0.30))",
              }}
            />
          </div>

          <div className="leading-tight">
            <div className="text-base md:text-lg font-bold tracking-wide">
              KnotShorts
            </div>
            <div className="text-[11px] md:text-xs text-white/50">
              Fast. Clean. Readable.
            </div>
          </div>
        </Link>

        {/* Desktop quick links */}
        <nav className="hidden md:flex items-center gap-1 text-sm text-white/70">
          {primary.map((c, i) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-full px-3 py-1.5 hover:bg-white/10 transition will-change-transform ks-fadeup-slow"
              style={{ animationDelay: `${140 + i * 80}ms` }}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {/* Right side controls (Search + Categories) */}
        <div className="flex items-center gap-2">
          {/* Search (desktop) */}
          <div className="hidden md:flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              placeholder="Search articles…"
              aria-label="Search articles"
              className="w-56 bg-transparent text-sm text-white/90 outline-none placeholder:text-white/40"
            />
            <button
              type="button"
              onClick={submitSearch}
              disabled={!canSearch}
              className="ml-2 rounded-full px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/10 transition disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Search
            </button>
          </div>

          {/* Search (mobile) - compact */}
          <Link
            href={searchHref}
            className="md:hidden rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition"
            aria-label="Open search"
          >
            Search
          </Link>

          {/* ✅ Top-right category button */}
          <details className="relative">
            <summary className="list-none cursor-pointer select-none rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition">
              Categories
            </summary>

            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/95 backdrop-blur shadow-xl">
              <div className="p-2">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className="block rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
