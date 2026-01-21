// app/api/image/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ✅ small helper
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ✅ fetch with retry for temporary upstream failures (Drive often does this)
async function fetchWithRetry(url: string, tries = 4) {
  let lastRes: Response | null = null;

  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome Safari",
      },
      cache: "no-store",
    });

    lastRes = res;

    // ✅ success
    if (res.ok) return res;

    // ✅ retry only on common transient statuses
    if ([429, 500, 502, 503, 504].includes(res.status) && i < tries - 1) {
      await sleep(350 * (i + 1));
      continue;
    }

    // ❌ non-retriable or out of retries
    return res;
  }

  // should not happen, but just in case
  return lastRes!;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = (searchParams.get("url") || "").trim();

  if (!url) {
    return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
  }

  // Basic safety: only allow http/https
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: "Invalid url" }, { status: 400 });
  }

  try {
    const upstream = await fetchWithRetry(url, 4);

    // ✅ IMPORTANT:
    // Never break /api/insta if Drive is temporarily failing.
    // Return a 1×1 transparent PNG as a safe fallback.
    if (!upstream.ok) {
      const transparent1x1Png = Uint8Array.from([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
        0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196,
        137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0,
        5, 0, 1, 13, 10, 42, 219, 0, 0, 0, 0, 73, 69, 78, 68, 174,
        66, 96, 130,
      ]);

      return new NextResponse(transparent1x1Png, {
        status: 200,
        headers: {
          "content-type": "image/png",
          // short cache so it can recover quickly when Drive works again
          "cache-control": "public, max-age=60, s-maxage=60",
          // helpful for debugging (optional)
          "x-image-proxy-fallback": `1 (upstream ${upstream.status})`,
        },
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const buf = await upstream.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "content-type": contentType,
        // Cache lightly in browser; tweak later
        "cache-control": "public, max-age=300",
      },
    });
  } catch (e: any) {
    // If something unexpected happens, still don't break /api/insta:
    // return a transparent PNG instead of JSON error.
    const transparent1x1Png = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196,
      137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0,
      5, 0, 1, 13, 10, 42, 219, 0, 0, 0, 0, 73, 69, 78, 68, 174,
      66, 96, 130,
    ]);

    return new NextResponse(transparent1x1Png, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=60, s-maxage=60",
        "x-image-proxy-fallback": "1 (exception)",
      },
    });
  }
}
