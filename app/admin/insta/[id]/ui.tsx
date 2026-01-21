"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function InstaDownloadClient({ id }: { id: string }) {
  const imgUrl = useMemo(() => `/api/insta?id=${id}&s=540${encodeURIComponent(id)}`, [id]);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function download() {
    try {
      setErr(null);
      setDownloading(true);

      const res = await fetch(imgUrl, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to generate image (${res.status})`);
      }

      const blob = await res.blob();

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `knotshorts-insta-${id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Download failed";
      setErr(msg);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Instagram Post Preview</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 transition hover:bg-white/10"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={download}
              disabled={downloading}
              className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 transition hover:bg-emerald-400/20 disabled:opacity-50"
            >
              {downloading ? "Downloading…" : "Download PNG"}
            </button>
          </div>
        </div>

        {err ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
            {err}
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="aspect-square w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl}
              alt="Instagram post preview"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>

          <div className="mt-3 text-xs text-white/60">
            Tip: If you see an error, the article likely needs a valid <b>coverImage</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
