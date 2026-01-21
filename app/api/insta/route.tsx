import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

type Article = {
  id: string;
  title: string;
  coverImage?: string | null;
};

function wrapTitleIntoLines(title: string, maxLines = 4) {
  const firstLineMax = 18;
  const otherLineMax = 24;

  const words = title
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const isFirst = lines.length === 0;
    const limit = isFirst ? firstLineMax : otherLineMax;
    const next = current ? `${current} ${w}` : w;

    if (next.length <= limit) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }

  if (lines.length < maxLines && current) lines.push(current);
  return lines.slice(0, maxLines);
}

/** PNG cache */
type CacheEntry = { bytes: ArrayBuffer; contentType: string; ts: number };
const PNG_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

function cacheGet(key: string): CacheEntry | null {
  const v = PNG_CACHE.get(key);
  if (!v) return null;
  if (Date.now() - v.ts > CACHE_TTL_MS) {
    PNG_CACHE.delete(key);
    return null;
  }
  return v;
}

function cacheSet(key: string, entry: CacheEntry) {
  PNG_CACHE.set(key, entry);
  if (PNG_CACHE.size > 150) {
    const firstKey = PNG_CACHE.keys().next().value;
    if (firstKey) PNG_CACHE.delete(firstKey);
  }
}

/** DataURL cache */
type DataUrlEntry = { dataUrl: string; ts: number };
const DATAURL_CACHE = new Map<string, DataUrlEntry>();
const DATAURL_TTL_MS = 1000 * 60 * 60 * 6;

function dataUrlGet(key: string): string | null {
  const v = DATAURL_CACHE.get(key);
  if (!v) return null;
  if (Date.now() - v.ts > DATAURL_TTL_MS) {
    DATAURL_CACHE.delete(key);
    return null;
  }
  return v.dataUrl;
}
function dataUrlSet(key: string, dataUrl: string) {
  DATAURL_CACHE.set(key, { dataUrl, ts: Date.now() });
  if (DATAURL_CACHE.size > 250) {
    const firstKey = DATAURL_CACHE.keys().next().value;
    if (firstKey) DATAURL_CACHE.delete(firstKey);
  }
}

/** Font cache (STATIC FONTS ONLY) */
let cachedIbmRegular: ArrayBuffer | null = null;
let cachedIbmItalic: ArrayBuffer | null = null;
let ibmTried = false;

async function getIbmFonts(origin: string) {
  if (cachedIbmRegular && cachedIbmItalic) return { regular: cachedIbmRegular, italic: cachedIbmItalic };
  if (ibmTried) return { regular: cachedIbmRegular, italic: cachedIbmItalic };
  ibmTried = true;

  try {
    const [regRes, itaRes] = await Promise.all([
      fetch(`${origin}/fonts/IBMPlexSans-Regular.ttf`, { cache: "force-cache" }),
      fetch(`${origin}/fonts/IBMPlexSans-Italic.ttf`, { cache: "force-cache" }),
    ]);

    if (regRes.ok) cachedIbmRegular = await regRes.arrayBuffer();
    if (itaRes.ok) cachedIbmItalic = await itaRes.arrayBuffer();
  } catch {
    // keep nulls
  }

  return { regular: cachedIbmRegular, italic: cachedIbmItalic };
}

/** base64 safe */
function arrayBufferToBase64(ab: ArrayBuffer) {
  return Buffer.from(new Uint8Array(ab)).toString("base64");
}

async function fetchAsDataUrl(url: string, cacheKey: string) {
  const hit = dataUrlGet(cacheKey);
  if (hit) return hit;

  const res = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome Safari",
    },
  });

  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
  const ct = res.headers.get("content-type") || "image/png";
  const ab = await res.arrayBuffer();
  const b64 = arrayBufferToBase64(ab);
  const dataUrl = `data:${ct};base64,${b64}`;
  dataUrlSet(cacheKey, dataUrl);
  return dataUrl;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = (searchParams.get("id") || "").trim();
    const sRaw = (searchParams.get("s") || "").trim();
    const size = sRaw === "540" ? 540 : 1080;

    if (!id) return new Response("Missing id", { status: 400 });

    const key = `${id}::${size}`;
    const hit = cacheGet(key);
    if (hit) {
      return new Response(hit.bytes, {
        status: 200,
        headers: {
          "content-type": hit.contentType,
          "cache-control": "public, max-age=86400, s-maxage=86400",
          "x-insta-cache": "HIT",
        },
      });
    }

    const origin = new URL(req.url).origin;

    const articleRes = await fetch(`${origin}/api/articles/id/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!articleRes.ok) return new Response(`Article fetch failed: ${articleRes.status}`, { status: 400 });

    const articleJson = await articleRes.json();
    const a: Article | null = articleJson?.article || null;
    if (!a) return new Response("Article not found", { status: 404 });

    const cover = (a.coverImage || "").trim();
    if (!cover) return new Response("No coverImage", { status: 400 });

    const title = (a.title || "").trim().toUpperCase();
    const lines = wrapTitleIntoLines(title, 4);
    const firstLine = lines[0] || "";
    const restLines = lines.slice(1);

    const coverUrl = `${origin}/api/image?url=${encodeURIComponent(cover)}`;
    const brandLogoUrl = `${origin}/brand/knotshorts-logo-1080.png`;

    const [bgDataUrl, brandLogoDataUrl] = await Promise.all([
      fetchAsDataUrl(coverUrl, `cover:${coverUrl}`),
      fetchAsDataUrl(brandLogoUrl, `logo:${brandLogoUrl}`),
    ]);

    const ibm = await getIbmFonts(origin);

    const ogFonts: { name: string; data: ArrayBuffer; style?: "normal" | "italic"; weight?: number }[] = [];
    if (ibm.regular) ogFonts.push({ name: "IBMPlexSans", data: ibm.regular, style: "normal", weight: 400 });
    if (ibm.italic) ogFonts.push({ name: "IBMPlexSansItalic", data: ibm.italic, style: "italic", weight: 400 });

    const scale = size / 1080;

    const img = new ImageResponse(
      (
        <div
          style={{
            width: size,
            height: size,
            position: "relative",
            display: "flex",
            background: "#000",
            overflow: "hidden",
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          }}
        >
          <img
            src={bgDataUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: `blur(${18 * scale}px)`,
              transform: "scale(1.08)",
            }}
          />
          <div style={{ position: "absolute", inset: 0, display: "flex", background: "rgba(0,0,0,0.35)" }} />
          <img
            src={bgDataUrl}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              height: 560 * scale,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.92) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 44 * scale,
              right: 44 * scale,
              zIndex: 8,
              width: 200 * scale,
              height: 48 * scale,
              borderRadius: 999,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, rgba(0,102,255,0.95) 0%, rgba(0,180,255,0.90) 55%, rgba(0,255,210,0.72) 100%)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                background:
                  "linear-gradient(120deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 100%)",
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <img
                src={brandLogoDataUrl}
                style={{
                  width: 200 * scale,
                  height: 200 * scale,
                  objectFit: "cover",
                  transform: `translateY(${5 * scale}px)`,
                }}
              />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 36 * scale,
              right: 36 * scale,
              bottom: 15 * scale,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6 * scale,
              textAlign: "center",
              zIndex: 6,
            }}
          >
            {firstLine ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 150 * scale,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 150 * scale,
                    height: 150 * scale,
                    display: "flex",
                    border: `${8 * scale}px solid #FFFFFF`,
                    overflow: "hidden",
                    background: "#000",
                  }}
                >
                  <img src={bgDataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#E10600",
                    color: "#FFFFFF",
                    padding: `${16 * scale}px ${24 * scale}px`,
                    fontSize: 76 * scale,
                    fontWeight: 800,
                    lineHeight: 1,
                    textShadow: "0 10px 30px rgba(0,0,0,0.55)",
                    fontFamily: ibm.italic ? "IBMPlexSansItalic, system-ui, sans-serif" : "system-ui, sans-serif",
                  }}
                >
                  {firstLine}
                </div>
              </div>
            ) : null}

            {restLines.length ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3 * scale,
                  color: "#FFFFFF",
                  fontFamily: ibm.regular ? "IBMPlexSans, system-ui, sans-serif" : "system-ui, sans-serif",
                }}
              >
                {restLines.slice(0, 3).map((ln, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 58 * scale,
                      fontWeight: 800,
                      lineHeight: 1.18,
                      letterSpacing: "0.08em",
                      textShadow: "0 10px 30px rgba(0,0,0,0.65)",
                    }}
                  >
                    {ln}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ),
      ({
        width: size,
        height: size,
        ...(ogFonts.length ? { fonts: ogFonts } : {}),
      } as any)
    );

    const bytes = await img.arrayBuffer();
    const contentType = img.headers.get("content-type") || "image/png";
    cacheSet(key, { bytes, contentType, ts: Date.now() });

    return new Response(bytes, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=86400",
        "x-insta-cache": "MISS",
      },
    });
  } catch (e: any) {
    const msg = e?.stack || e?.message || String(e);
    console.error("INSTA ERROR:", msg);
    return new Response(msg, { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}
