/**
 * Public image URLs for Meesho CSV.
 * Meesho’s crawler cannot use private Drive links — we serve files via /api/meesho/image/[fileId].
 */

export function appBaseUrl(reqOrigin?: string | null) {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (reqOrigin) return reqOrigin.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Absolute URL Meesho (and the review UI) can fetch */
export function publicDriveImageUrl(fileId: string, baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/api/meesho/image/${encodeURIComponent(fileId)}`;
}

export function isDriveFileId(value: string) {
  return /^[a-zA-Z0-9_-]{20,}$/.test(value) && !value.includes("://");
}
