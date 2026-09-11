import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Public image proxy for Meesho bulk CSV.
 * Drive files stay in your folder; Meesho downloads via this URL.
 *
 * Folder must be shared: Anyone with the link → Viewer
 * (or GOOGLE_API_KEY must have access to the file).
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ fileId: string }> }
) {
  const { fileId: raw } = await ctx.params;
  const fileId = decodeURIComponent(raw || "").trim();
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  }

  const key = process.env.GOOGLE_API_KEY?.trim() || "";

  try {
    // Prefer API key media download (works when key can access the file)
    if (key) {
      const apiUrl =
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}` +
        `?alt=media&key=${encodeURIComponent(key)}`;
      const res = await fetch(apiUrl, { redirect: "follow" });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const type = res.headers.get("content-type") || "image/jpeg";
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type": type,
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // Fallback: public “anyone with link” download
    const publicUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
    const res = await fetch(publicUrl, { redirect: "follow" });
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            "Could not load Drive image. Share the file/folder as Anyone with the link → Viewer, and set GOOGLE_API_KEY.",
        },
        { status: 502 }
      );
    }
    const buf = await res.arrayBuffer();
    const type = res.headers.get("content-type") || "image/jpeg";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type.startsWith("text/") ? "image/jpeg" : type,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image proxy failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
