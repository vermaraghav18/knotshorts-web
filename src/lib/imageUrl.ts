// src/lib/imageUrl.ts

export function normalizeImageUrl(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return "";

  // Allow data/blob URLs
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

  // Google Drive patterns:
  // 1) https://drive.google.com/file/d/<ID>/view?usp=sharing
  // 2) https://drive.google.com/open?id=<ID>
  // 3) https://drive.google.com/uc?export=view&id=<ID>
  const driveFileMatch = raw.match(/drive\.google\.com\/file\/d\/([^/]+)\//i);
  const driveOpenMatch = raw.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  const driveUcMatch = raw.match(/drive\.google\.com\/uc\?.*id=([^&]+)/i);

  const fileId = driveFileMatch?.[1] || driveOpenMatch?.[1] || driveUcMatch?.[1];

  if (fileId) {
    // This URL redirects to drive.usercontent.google.com (which is BLOCKED for <img>),
    // so we will ALWAYS render via our proxy.
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
  }

  // Cloudinary/S3/normal URLs
  return raw;
}

// ✅ Always use this for <img src> when you don't control the host headers (Drive, etc.)
export function proxiedImageSrc(url: unknown): string {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return "";
  // If it's already same-origin (e.g. /uploads/x.png), keep it.
  if (normalized.startsWith("/")) return normalized;

  return `/api/image?url=${encodeURIComponent(normalized)}`;
}
