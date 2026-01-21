"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DeleteArticleButton from "./DeleteArticleButton";

import {
  CLUB_POSITION_LABELS,
  CLUB_POSITIONS,
  CLUB_ARTICLES_REQUIRED_COUNT,
  type ClubPosition,
} from "@/src/lib/clubArticles";

import {
  SPOTLIGHT_POSITION_LABELS,
  SPOTLIGHT_POSITIONS,
  SPOTLIGHT_ARTICLES_REQUIRED_COUNT,
  type SpotlightPosition,
} from "@/src/lib/spotlightArticles";

import {
  DUO_POSITION_LABELS,
  DUO_POSITIONS,
  DUO_ARTICLES_REQUIRED_COUNT,
  type DuoPosition,
} from "@/src/lib/duoArticles";

type Article = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: "draft" | "published";
  createdAt: string;
  publishedAt: string | null;
  coverImage: string | null;
};

type Toast =
  | { type: "ok"; msg: string }
  | { type: "err"; msg: string }
  | null;

export default function ClubArticlesPicker({ articles }: { articles: Article[] }) {
  // ✅ Separate selections
  const [clubSelectedIds, setClubSelectedIds] = useState<string[]>([]);
  const [spotlightSelectedIds, setSpotlightSelectedIds] = useState<string[]>([]);
  const [duoSelectedIds, setDuoSelectedIds] = useState<string[]>([]);

  // ✅ Separate modals
  const [clubOpen, setClubOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [duoOpen, setDuoOpen] = useState(false);

  // ✅ Separate positions
  const [clubPosition, setClubPosition] =
    useState<ClubPosition>("after_top_stories");
  const [spotlightPosition, setSpotlightPosition] =
    useState<SpotlightPosition>("after_top_stories");
  const [duoPosition, setDuoPosition] =
    useState<DuoPosition>("after_top_stories");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // ✅ Prefill all dropdowns from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/club-articles", { cache: "no-store" });
        const json = await res.json();
        if (json?.config?.position) {
          setClubPosition(json.config.position as ClubPosition);
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch("/api/spotlight-articles", { cache: "no-store" });
        const json = await res.json();
        if (json?.config?.position) {
          setSpotlightPosition(json.config.position as SpotlightPosition);
        }
      } catch {
        // ignore
      }

      try {
        const res = await fetch("/api/duo-articles", { cache: "no-store" });
        const json = await res.json();
        if (json?.config?.position) {
          setDuoPosition(json.config.position as DuoPosition);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const clubCount = clubSelectedIds.length;
  const spotlightCount = spotlightSelectedIds.length;
  const duoCount = duoSelectedIds.length;

  const canSelectMoreClub = clubCount < CLUB_ARTICLES_REQUIRED_COUNT;
  const canSelectMoreSpotlight =
    spotlightCount < SPOTLIGHT_ARTICLES_REQUIRED_COUNT;
  const canSelectMoreDuo = duoCount < DUO_ARTICLES_REQUIRED_COUNT;

  function isInOtherBucket(bucket: "club" | "spotlight" | "duo", id: string) {
    if (bucket !== "club" && clubSelectedIds.includes(id)) return "Club";
    if (bucket !== "spotlight" && spotlightSelectedIds.includes(id))
      return "Spotlight";
    if (bucket !== "duo" && duoSelectedIds.includes(id)) return "Duo";
    return null;
  }

  function toggleClub(id: string) {
    setToast(null);

    const inOther = isInOtherBucket("club", id);
    if (inOther) {
      setToast({ type: "err", msg: `This article is already in ${inOther}.` });
      return;
    }

    setClubSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= CLUB_ARTICLES_REQUIRED_COUNT) return prev;
      return [...prev, id];
    });
  }

  function toggleSpotlight(id: string) {
    setToast(null);

    const inOther = isInOtherBucket("spotlight", id);
    if (inOther) {
      setToast({ type: "err", msg: `This article is already in ${inOther}.` });
      return;
    }

    setSpotlightSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= SPOTLIGHT_ARTICLES_REQUIRED_COUNT) return prev;
      return [...prev, id];
    });
  }

  function toggleDuo(id: string) {
    setToast(null);

    const inOther = isInOtherBucket("duo", id);
    if (inOther) {
      setToast({ type: "err", msg: `This article is already in ${inOther}.` });
      return;
    }

    setDuoSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= DUO_ARTICLES_REQUIRED_COUNT) return prev;
      return [...prev, id];
    });
  }

  const showClubButton = clubCount === CLUB_ARTICLES_REQUIRED_COUNT;
  const showSpotlightButton =
    spotlightCount === SPOTLIGHT_ARTICLES_REQUIRED_COUNT;
  const showDuoButton = duoCount === DUO_ARTICLES_REQUIRED_COUNT;

  const showBottomBar = showClubButton || showSpotlightButton || showDuoButton;

  async function saveClub() {
    setToast(null);
    setSaving(true);
    try {
      const res = await fetch("/api/club-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: clubPosition,
          articleIds: clubSelectedIds,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ type: "err", msg: json?.error || "Failed to save Club" });
        setSaving(false);
        return;
      }

      setToast({ type: "ok", msg: "Club Articles saved successfully" });
      setClubOpen(false);
      setSaving(false);
    } catch {
      setToast({ type: "err", msg: "Network error while saving Club" });
      setSaving(false);
    }
  }

  async function clearClub() {
    setToast(null);
    setSaving(true);
    try {
      const res = await fetch("/api/club-articles", { method: "DELETE" });
      if (!res.ok) {
        setToast({ type: "err", msg: "Failed to clear Club Articles" });
        setSaving(false);
        return;
      }
      setToast({ type: "ok", msg: "Club Articles cleared" });
      setClubSelectedIds([]);
      setClubOpen(false);
      setSaving(false);
    } catch {
      setToast({ type: "err", msg: "Network error while clearing Club" });
      setSaving(false);
    }
  }

  async function saveSpotlight() {
    setToast(null);
    setSaving(true);
    try {
      const res = await fetch("/api/spotlight-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: spotlightPosition,
          articleIds: spotlightSelectedIds,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ type: "err", msg: json?.error || "Failed to save Spotlight" });
        setSaving(false);
        return;
      }

      setToast({ type: "ok", msg: "Spotlight Articles saved successfully" });
      setSpotlightOpen(false);
      setSaving(false);
    } catch {
      setToast({ type: "err", msg: "Network error while saving Spotlight" });
      setSaving(false);
    }
  }

  async function clearSpotlight() {
    setToast(null);
    setSaving(true);
    try {
      const res = await fetch("/api/spotlight-articles", { method: "DELETE" });
      if (!res.ok) {
        setToast({ type: "err", msg: "Failed to clear Spotlight Articles" });
        setSaving(false);
        return;
      }
      setToast({ type: "ok", msg: "Spotlight Articles cleared" });
      setSpotlightSelectedIds([]);
      setSpotlightOpen(false);
      setSaving(false);
    } catch {
      setToast({ type: "err", msg: "Network error while clearing Spotlight" });
      setSaving(false);
    }
  }

  async function saveDuo() {
    setToast(null);
    setSaving(true);
    try {
      const res = await fetch("/api/duo-articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position: duoPosition,
          articleIds: duoSelectedIds,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ type: "err", msg: json?.error || "Failed to save Duo" });
        setSaving(false);
        return;
      }

      setToast({ type: "ok", msg: "Duo Articles saved successfully" });
      setDuoOpen(false);
      setSaving(false);
    } catch {
      setToast({ type: "err", msg: "Network error while saving Duo" });
      setSaving(false);
    }
  }

  async function clearDuo() {
    setToast(null);
    setSaving(true);
    try {
      const res = await fetch("/api/duo-articles", { method: "DELETE" });
      if (!res.ok) {
        setToast({ type: "err", msg: "Failed to clear Duo Articles" });
        setSaving(false);
        return;
      }
      setToast({ type: "ok", msg: "Duo Articles cleared" });
      setDuoSelectedIds([]);
      setDuoOpen(false);
      setSaving(false);
    } catch {
      setToast({ type: "err", msg: "Network error while clearing Duo" });
      setSaving(false);
    }
  }

  const sorted = useMemo(() => {
    return articles;
  }, [articles]);

  return (
    <div className="space-y-3">
      {toast ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === "ok"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {toast.msg}
        </div>
      ) : null}

      {sorted.map((a) => {
        const clubChecked = clubSelectedIds.includes(a.id);
        const spotlightChecked = spotlightSelectedIds.includes(a.id);
        const duoChecked = duoSelectedIds.includes(a.id);

        const clubDisabled =
          (!clubChecked && !canSelectMoreClub) || spotlightChecked || duoChecked;

        const spotlightDisabled =
          (!spotlightChecked && !canSelectMoreSpotlight) ||
          clubChecked ||
          duoChecked;

        const duoDisabled =
          (!duoChecked && !canSelectMoreDuo) || clubChecked || spotlightChecked;

        return (
          <div
            key={a.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-4"
          >
            {/* Left: triple checkboxes + info */}
            <div className="min-w-0 flex items-start gap-3">
              <div className="pt-1 flex flex-col gap-2">
                {/* Club (5) */}
                <label className="flex items-center gap-2 text-xs text-white/70 select-none">
                  <input
                    type="checkbox"
                    checked={clubChecked}
                    disabled={clubDisabled}
                    onChange={() => toggleClub(a.id)}
                    className="h-4 w-4 accent-emerald-400"
                    title={
                      spotlightChecked
                        ? "Already selected for Spotlight"
                        : duoChecked
                        ? "Already selected for Duo"
                        : clubDisabled
                        ? `You can select only ${CLUB_ARTICLES_REQUIRED_COUNT} for Club`
                        : "Select for Club Articles"
                    }
                  />
                  <span>Club</span>
                </label>

                {/* Spotlight (3) */}
                <label className="flex items-center gap-2 text-xs text-white/70 select-none">
                  <input
                    type="checkbox"
                    checked={spotlightChecked}
                    disabled={spotlightDisabled}
                    onChange={() => toggleSpotlight(a.id)}
                    className="h-4 w-4 accent-sky-400"
                    title={
                      clubChecked
                        ? "Already selected for Club"
                        : duoChecked
                        ? "Already selected for Duo"
                        : spotlightDisabled
                        ? `You can select only ${SPOTLIGHT_ARTICLES_REQUIRED_COUNT} for Spotlight`
                        : "Select for Spotlight Articles"
                    }
                  />
                  <span>Spot</span>
                </label>

                {/* Duo (2) */}
                <label className="flex items-center gap-2 text-xs text-white/70 select-none">
                  <input
                    type="checkbox"
                    checked={duoChecked}
                    disabled={duoDisabled}
                    onChange={() => toggleDuo(a.id)}
                    className="h-4 w-4 accent-orange-400"
                    title={
                      clubChecked
                        ? "Already selected for Club"
                        : spotlightChecked
                        ? "Already selected for Spotlight"
                        : duoDisabled
                        ? `You can select only ${DUO_ARTICLES_REQUIRED_COUNT} for Duo`
                        : "Select for Duo Articles"
                    }
                  />
                  <span>Duo</span>
                </label>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
                    {a.category}
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1">
                    {a.status}
                  </span>
                  <span className="text-white/40">
                    {String(a.publishedAt || a.createdAt).slice(0, 10)}
                  </span>
                </div>

                <div className="mt-2 font-semibold truncate">{a.title}</div>
                <div className="mt-1 text-xs text-white/40 truncate">
                  /article/{a.slug}
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/admin/edit/${a.id}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition text-sm"
              >
                Edit
              </Link>

              <DeleteArticleButton id={a.id} />

              <Link
                href={`/article/${a.slug}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition text-sm"
                target="_blank"
              >
                View
              </Link>

              <Link
                href={`/admin/insta/${a.id}`}
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 hover:bg-emerald-400/20 transition text-sm"
                target="_blank"
              >
                Post
              </Link>
            </div>
          </div>
        );
      })}

      {/* Bottom sticky bar */}
      {showBottomBar ? (
        <div className="fixed inset-x-0 bottom-0 z-50">
          <div className="mx-auto max-w-5xl px-4 pb-4">
            <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur p-3 flex items-center justify-between gap-3">
              <div className="text-sm text-white/80">
                Club: <span className="font-semibold">{clubCount}</span>/
                {CLUB_ARTICLES_REQUIRED_COUNT} • Spotlight:{" "}
                <span className="font-semibold">{spotlightCount}</span>/
                {SPOTLIGHT_ARTICLES_REQUIRED_COUNT} • Duo:{" "}
                <span className="font-semibold">{duoCount}</span>/
                {DUO_ARTICLES_REQUIRED_COUNT}
              </div>

              <div className="flex items-center gap-2">
                {showDuoButton ? (
                  <button
                    onClick={() => setDuoOpen(true)}
                    className="rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 hover:bg-orange-400/20 transition text-sm"
                  >
                    Duo Articles
                  </button>
                ) : null}

                {showSpotlightButton ? (
                  <button
                    onClick={() => setSpotlightOpen(true)}
                    className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 hover:bg-sky-400/20 transition text-sm"
                  >
                    Spotlight Articles
                  </button>
                ) : null}

                {showClubButton ? (
                  <button
                    onClick={() => setClubOpen(true)}
                    className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 hover:bg-emerald-400/20 transition text-sm"
                  >
                    Club Articles
                  </button>
                ) : null}

                <button
                  onClick={() => {
                    setClubSelectedIds([]);
                    setSpotlightSelectedIds([]);
                    setDuoSelectedIds([]);
                  }}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition text-sm"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Duo Modal */}
      {duoOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => (saving ? null : setDuoOpen(false))}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0b] p-5">
            <div className="text-lg font-bold">Create Duo Articles</div>
            <div className="mt-1 text-sm text-white/60">
              Choose where this block appears on the homepage.
            </div>

            <div className="mt-4">
              <label className="text-xs text-white/60">Position</label>
              <select
                value={duoPosition}
                onChange={(e) => setDuoPosition(e.target.value as DuoPosition)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {DUO_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {DUO_POSITION_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 text-xs text-white/50">
              Selected article IDs (order will be preserved):
              <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2 font-mono text-[11px] text-white/70 break-all">
                {duoSelectedIds.join(", ")}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={clearDuo}
                disabled={saving}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 hover:bg-red-500/20 transition text-sm disabled:opacity-60"
              >
                Clear Existing Duo
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => (saving ? null : setDuoOpen(false))}
                  disabled={saving}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition text-sm disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={saveDuo}
                  disabled={saving}
                  className="rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 hover:bg-orange-400/20 transition text-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Spotlight Modal */}
      {spotlightOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => (saving ? null : setSpotlightOpen(false))}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0b] p-5">
            <div className="text-lg font-bold">Create Spotlight Articles</div>
            <div className="mt-1 text-sm text-white/60">
              Choose where this block appears on the homepage.
            </div>

            <div className="mt-4">
              <label className="text-xs text-white/60">Position</label>
              <select
                value={spotlightPosition}
                onChange={(e) =>
                  setSpotlightPosition(e.target.value as SpotlightPosition)
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {SPOTLIGHT_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {SPOTLIGHT_POSITION_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 text-xs text-white/50">
              Selected article IDs (order will be preserved):
              <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2 font-mono text-[11px] text-white/70 break-all">
                {spotlightSelectedIds.join(", ")}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={clearSpotlight}
                disabled={saving}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 hover:bg-red-500/20 transition text-sm disabled:opacity-60"
              >
                Clear Existing Spotlight
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => (saving ? null : setSpotlightOpen(false))}
                  disabled={saving}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition text-sm disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={saveSpotlight}
                  disabled={saving}
                  className="rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 hover:bg-sky-400/20 transition text-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Club Modal */}
      {clubOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => (saving ? null : setClubOpen(false))}
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0b] p-5">
            <div className="text-lg font-bold">Create Club Articles</div>
            <div className="mt-1 text-sm text-white/60">
              Choose where this block appears on the homepage.
            </div>

            <div className="mt-4">
              <label className="text-xs text-white/60">Position</label>
              <select
                value={clubPosition}
                onChange={(e) => setClubPosition(e.target.value as ClubPosition)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
              >
                {CLUB_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {CLUB_POSITION_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 text-xs text-white/50">
              Selected article IDs (order will be preserved):
              <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2 font-mono text-[11px] text-white/70 break-all">
                {clubSelectedIds.join(", ")}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={clearClub}
                disabled={saving}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 hover:bg-red-500/20 transition text-sm disabled:opacity-60"
              >
                Clear Existing Club
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => (saving ? null : setClubOpen(false))}
                  disabled={saving}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 hover:bg-white/10 transition text-sm disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={saveClub}
                  disabled={saving}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 hover:bg-emerald-400/20 transition text-sm disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
