// src/lib/apiBase.ts
export function getApiBaseUrl() {
  // 1) Explicit override (best for Vercel frontend -> Render backend)
  const explicit =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "";
  if (explicit) return explicit.replace(/\/+$/, "");

  // 2) Vercel provides VERCEL_URL (no protocol)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // 3) Render can provide RENDER_EXTERNAL_URL
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;

  // 4) Local dev fallback
  return "http://localhost:3000";
}
