"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { proxiedImageSrc } from "@/src/lib/imageUrl";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  status: "draft" | "published" | string;
  featured: number;
  breaking: number;
  ticker?: number;

  // ✅ Container 1
  mainHero?: number;
  mainHeroSlot?: string | null;

  // ✅ Container 2
  hero2?: number;
  hero2Slot?: string | null;

  // ✅ Container 3
  hero3?: number;
  hero3Slot?: string | null;

  tags: string[];
  coverImage: string | null;
};

const MAIN_HERO_SLOTS = [
  { value: "after_insta_strip", label: "After Insta Strip" },
  { value: "after_top_stories", label: "After Top Stories" },
  { value: "after_india_section", label: "After India Section" },
];

// ✅ Container 2 slots (same list for now, simple)
const HERO2_SLOTS = [
  { value: "after_insta_strip", label: "After Insta Strip" },
  { value: "after_top_stories", label: "After Top Stories" },
  { value: "after_india_section", label: "After India Section" },
];

// ✅ Container 3 slots (same list for now, simple)
const HERO3_SLOTS = [
  { value: "after_insta_strip", label: "After Insta Strip" },
  { value: "after_top_stories", label: "After Top Stories" },
  { value: "after_india_section", label: "After India Section" },
];

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();

  const rawId = (params as any)?.id;
  const id =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId) && typeof rawId[0] === "string"
      ? rawId[0]
      : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("World");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [breaking, setBreaking] = useState(false);
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

  const [tagsText, setTagsText] = useState("");
  const [coverImage, setCoverImage] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    (async () => {
      const res = await fetch(`/api/articles/id/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      const a: Article | undefined = json?.article;

      if (!res.ok || !a) {
        alert(json?.error || "Not found");
        router.push("/admin");
        return;
      }

      setTitle(a.title || "");
      setSlug(a.slug || "");
      setSummary(a.summary || "");
      setBody(a.body || "");
      setCategory(a.category || "World");
      setStatus(
        String(a.status).toLowerCase() === "published" ? "published" : "draft"
      );
      setFeatured(Number(a.featured) === 1);
      setBreaking(Number(a.breaking) === 1);
      setTicker(Number(a.ticker || 0) === 1);

      // ✅ load Container 1
      setMainHero(Number(a.mainHero || 0) === 1);
      setMainHeroSlot(a.mainHeroSlot || "");

      // ✅ load Container 2
      setHero2(Number(a.hero2 || 0) === 1);
      setHero2Slot(a.hero2Slot || "");

      // ✅ load Container 3
      setHero3(Number(a.hero3 || 0) === 1);
      setHero3Slot(a.hero3Slot || "");

      setTagsText((a.tags || []).join(", "));
      setCoverImage(a.coverImage || "");

      setLoading(false);
    })();
  }, [id, router]);

  const previewSrc = useMemo(() => {
    const raw = coverImage.trim();
    return raw ? proxiedImageSrc(raw) : "";
  }, [coverImage]);

  // ✅ helper: prevents 2+ containers using same slot (layout collision)
  const hasSlotCollision = useMemo(() => {
    const chosen = [
      mainHero ? mainHeroSlot : "",
      hero2 ? hero2Slot : "",
      hero3 ? hero3Slot : "",
    ].filter(Boolean);
    return new Set(chosen).size !== chosen.length;
  }, [mainHero, mainHeroSlot, hero2, hero2Slot, hero3, hero3Slot]);

  const canSave = useMemo(() => {
    if (mainHero && !mainHeroSlot) return false;
    if (hero2 && !hero2Slot) return false;
    if (hero3 && !hero3Slot) return false;
    if (hasSlotCollision) return false;

    return !!(title.trim() && summary.trim() && body.trim() && category.trim());
  }, [
    title,
    summary,
    body,
    category,
    mainHero,
    mainHeroSlot,
    hero2,
    hero2Slot,
    hero3,
    hero3Slot,
    hasSlotCollision,
  ]);

  const viewHref = useMemo(() => {
    const s = String(slug || "").trim();
    return s ? `/article/${encodeURIComponent(s)}` : "";
  }, [slug]);

  const instaHref = useMemo(() => {
    return id ? `/admin/insta/${encodeURIComponent(id)}` : "";
  }, [id]);

  async function onSave() {
    if (!id) return alert("Missing id");

    if (mainHero && !mainHeroSlot) {
      return alert("Please select placement for Main News Container.");
    }
    if (hero2 && !hero2Slot) {
      return alert("Please select placement for News Container 2.");
    }
    if (hero3 && !hero3Slot) {
      return alert("Please select placement for News Container 3.");
    }
    if (hasSlotCollision) {
      return alert(
        "Placement conflict: choose different placements for Container 1/2/3 (no two containers can use the same slot)."
      );
    }
    if (!title.trim() || !summary.trim() || !body.trim() || !category.trim()) {
      return alert("Fill required fields");
    }

    setSaving(true);

    const res = await fetch(`/api/articles/id/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        summary,
        body,
        category,
        status,
        featured: featured ? 1 : 0,
        breaking: breaking ? 1 : 0,
        ticker: ticker ? 1 : 0,

        // ✅ Container 1
        mainHero,
        mainHeroSlot: mainHero ? mainHeroSlot : "",

        // ✅ Container 2
        hero2,
        hero2Slot: hero2 ? hero2Slot : "",

        // ✅ Container 3
        hero3,
        hero3Slot: hero3 ? hero3Slot : "",

        tags: tagsText,
        coverImage: coverImage || null,
      }),
    });

    const json = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) return alert(json?.error || "Save failed");
    router.push("/admin");
  }

  async function onDelete() {
    if (!id) return alert("Missing id");

    const ok = confirm("Delete this article permanently?");
    if (!ok) return;

    setDeleting(true);
    const res = await fetch(`/api/articles/id/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json().catch(() => ({}));
    setDeleting(false);

    if (!res.ok) return alert(json?.error || "Delete failed");
    router.push("/admin");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 text-white/70">
          Loading…
        </div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-3xl px-4 py-10 text-white/70">
          Invalid URL — missing article id.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Edit Article</h1>

          <div className="flex items-center gap-2">
            <a
              href={viewHref || "#"}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition"
              style={{
                pointerEvents: viewHref ? "auto" : "none",
                opacity: viewHref ? 1 : 0.55,
              }}
              title={viewHref ? "Open public article" : "Slug missing"}
            >
              View
            </a>

            <a
              href={instaHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 hover:bg-emerald-400/20 transition"
              title="Generate Instagram post (1080×1080)"
            >
              Post
            </a>

            <button
              onClick={onDelete}
              disabled={deleting}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 hover:bg-red-500/20 transition disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>

            <button
              onClick={() => router.push("/admin")}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition"
            >
              Back
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title *"
          />

          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (optional)"
          />

          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category *"
          />

          <input
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Tags (comma separated)"
          />

          {/* ✅ Cover image URL input + preview */}
          <div className="space-y-2">
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Cover image URL (optional) — Google Drive or Cloudinary"
            />

            {coverImage.trim() ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img
                  src={previewSrc}
                  alt="Cover preview"
                  className="w-full h-[220px] object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
          </div>

          <textarea
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 min-h-[110px]"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary *"
          />

          <textarea
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 min-h-[260px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body *"
          />

          {/* ✅ Collision warning (helps avoid confusion) */}
          {hasSlotCollision ? (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              Placement conflict: two containers are using the same slot. Choose
              different placements for Container 1/2/3.
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured
            </label>

            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={breaking}
                onChange={(e) => setBreaking(e.target.checked)}
              />
              Breaking
            </label>

            <label className="flex items-center gap-2 text-white/70">
              <input
                type="checkbox"
                checked={ticker}
                onChange={(e) => setTicker(e.target.checked)}
              />
              Ticker
            </label>

            {/* ✅ Container 1 */}
            <label className="flex items-center gap-2 text-white/70 font-semibold">
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
            <label className="flex items-center gap-2 text-white/70 font-semibold">
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
            <label className="flex items-center gap-2 text-white/70 font-semibold">
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

            <select
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>

          {/* ✅ Container 1 placement */}
          {mainHero ? (
            <select
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              value={mainHeroSlot}
              onChange={(e) => setMainHeroSlot(e.target.value)}
              required
            >
              <option value="">Select Main News Placement</option>
              {MAIN_HERO_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : null}

          {/* ✅ Container 2 placement */}
          {hero2 ? (
            <select
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              value={hero2Slot}
              onChange={(e) => setHero2Slot(e.target.value)}
              required
            >
              <option value="">Select News Container 2 Placement</option>
              {HERO2_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : null}

          {/* ✅ Container 3 placement */}
          {hero3 ? (
            <select
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3"
              value={hero3Slot}
              onChange={(e) => setHero3Slot(e.target.value)}
              required
            >
              <option value="">Select News Container 3 Placement</option>
              {HERO3_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : null}

          <button
            disabled={!canSave || saving}
            onClick={onSave}
            className="rounded-full border border-white/15 bg-white/10 px-5 py-3 hover:bg-white/15 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
