"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "World",
  "India",
  "Entertainment",
  "Business",
  "Sports",
  "Technology",
  "Health",
  "Lifestyle",
];

const MAIN_HERO_SLOTS = [
  { value: "after_insta_strip", label: "After Insta Strip" },
  { value: "after_top_stories", label: "After Top Stories" },
  { value: "after_india_section", label: "After India Section" },
];

// ✅ Container 2 slots
const HERO2_SLOTS = [
  { value: "after_insta_strip", label: "After Insta Strip" },
  { value: "after_top_stories", label: "After Top Stories" },
  { value: "after_india_section", label: "After India Section" },
];

// ✅ Container 3 slots
const HERO3_SLOTS = [
  { value: "after_insta_strip", label: "After Insta Strip" },
  { value: "after_top_stories", label: "After Top Stories" },
  { value: "after_india_section", label: "After India Section" },
];

export default function AdminNewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("World");
  const [tagsText, setTagsText] = useState("");

  // ✅ cover image input (Google Drive / Cloudinary)
  const [coverImage, setCoverImage] = useState("");

  const [featured, setFeatured] = useState(false);
  const [breaking, setBreaking] = useState(false);

  // ✅ ticker state
  const [ticker, setTicker] = useState(false);

  // ✅ Container 1
  const [mainHero, setMainHero] = useState(false);
  const [mainHeroSlot, setMainHeroSlot] = useState("");

  // ✅ Container 2
  const [hero2, setHero2] = useState(false);
  const [hero2Slot, setHero2Slot] = useState("");

  // ✅ Container 3
  const [hero3, setHero3] = useState(false);
  const [hero3Slot, setHero3Slot] = useState("");

  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // ✅ validate container 1
    if (mainHero && !mainHeroSlot) {
      setError("Please select placement for Main News Container.");
      return;
    }

    // ✅ validate container 2
    if (hero2 && !hero2Slot) {
      setError("Please select placement for News Container 2.");
      return;
    }

    // ✅ validate container 3
    if (hero3 && !hero3Slot) {
      setError("Please select placement for News Container 3.");
      return;
    }

    // ✅ prevent collisions: same slot cannot be used by multiple containers
    const chosenSlots = [
      mainHero ? mainHeroSlot : "",
      hero2 ? hero2Slot : "",
      hero3 ? hero3Slot : "",
    ].filter(Boolean);

    const uniqueSlots = new Set(chosenSlots);
    if (uniqueSlots.size !== chosenSlots.length) {
      setError(
        "Placement conflict: Please choose different placements for Container 1/2/3 (no two containers can use the same slot)."
      );
      return;
    }

    setLoading(true);

    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          summary,
          body,
          category,
          tags,
          coverImage: coverImage || null,
          featured,
          breaking,
          ticker,
          status,

          // ✅ Container 1
          mainHero,
          mainHeroSlot,

          // ✅ Container 2
          hero2,
          hero2Slot,

          // ✅ Container 3
          hero3,
          hero3Slot,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json?.error || "Failed to create article.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Article</h1>
          <p className="text-white/60 text-sm">
            Add news to KnotShorts. (No auth yet — we will secure later.)
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
              {error}
            </div>
          ) : null}

          <div>
            <label className="text-sm text-white/70">Title *</label>
            <input
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Eg: India’s GDP growth beats expectations..."
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Slug (optional)</label>
            <input
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated if empty"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Summary *</label>
            <textarea
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="60–100 words summary..."
              required
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Body *</label>
            <textarea
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Full article text..."
              required
            />
          </div>

          {/* ✅ Cover image URL */}
          <div>
            <label className="text-sm text-white/70">
              Cover Image URL (optional) — Google Drive or Cloudinary
            </label>
            <input
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://drive.google.com/uc?export=view&id=... or https://res.cloudinary.com/..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/70">Category</label>
              <select
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-black">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-white/70">
                Tags (comma separated)
              </label>
              <input
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="india, economy, markets"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured
            </label>

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={breaking}
                onChange={(e) => setBreaking(e.target.checked)}
              />
              Breaking
            </label>

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={ticker}
                onChange={(e) => setTicker(e.target.checked)}
              />
              Ticker
            </label>

            {/* ✅ Container 1 */}
            <label className="flex items-center gap-2 text-sm text-white/70 font-semibold">
              <input
                type="checkbox"
                checked={mainHero}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setMainHero(checked);
                  if (!checked) setMainHeroSlot("");
                }}
              />
              Main News Container
            </label>

            {/* ✅ Container 2 */}
            <label className="flex items-center gap-2 text-sm text-white/70 font-semibold">
              <input
                type="checkbox"
                checked={hero2}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHero2(checked);
                  if (!checked) setHero2Slot("");
                }}
              />
              News Container 2
            </label>

            {/* ✅ Container 3 */}
            <label className="flex items-center gap-2 text-sm text-white/70 font-semibold">
              <input
                type="checkbox"
                checked={hero3}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setHero3(checked);
                  if (!checked) setHero3Slot("");
                }}
              />
              News Container 3
            </label>

            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Status:</span>
              <select
                className="rounded-lg bg-white/5 border border-white/10 px-2 py-1 outline-none focus:border-white/30"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
              >
                <option value="draft" className="bg-black">
                  Draft
                </option>
                <option value="published" className="bg-black">
                  Published
                </option>
              </select>
            </div>
          </div>

          {/* ✅ Placement dropdown (Container 1) */}
          {mainHero ? (
            <div>
              <label className="text-sm text-white/70">
                Main News Placement *
              </label>
              <select
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                value={mainHeroSlot}
                onChange={(e) => setMainHeroSlot(e.target.value)}
                required
              >
                <option value="" className="bg-black">
                  Select placement
                </option>
                {MAIN_HERO_SLOTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-black">
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/50">
                Only one Main News can exist per placement. Selecting a new one
                will replace the previous.
              </p>
            </div>
          ) : null}

          {/* ✅ Placement dropdown (Container 2) */}
          {hero2 ? (
            <div>
              <label className="text-sm text-white/70">
                News Container 2 Placement *
              </label>
              <select
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                value={hero2Slot}
                onChange={(e) => setHero2Slot(e.target.value)}
                required
              >
                <option value="" className="bg-black">
                  Select placement
                </option>
                {HERO2_SLOTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-black">
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/50">
                Only one News Container 2 can exist per placement. Selecting a
                new one will replace the previous.
              </p>
            </div>
          ) : null}

          {/* ✅ Placement dropdown (Container 3) */}
          {hero3 ? (
            <div>
              <label className="text-sm text-white/70">
                News Container 3 Placement *
              </label>
              <select
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
                value={hero3Slot}
                onChange={(e) => setHero3Slot(e.target.value)}
                required
              >
                <option value="" className="bg-black">
                  Select placement
                </option>
                {HERO3_SLOTS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-black">
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-white/50">
                Only one News Container 3 can exist per placement. Selecting a
                new one will replace the previous.
              </p>
            </div>
          ) : null}

          <button
            disabled={loading}
            className="rounded-lg bg-white text-black px-4 py-2 font-semibold disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Article"}
          </button>
        </form>
      </div>
    </div>
  );
}
