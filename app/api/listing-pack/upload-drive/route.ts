import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_DRIVE_FOLDER_ID } from "@/lib/meesho/types";

export const runtime = "nodejs";
export const maxDuration = 120;

type UploadFile = {
  name: string;
  mimeType?: string;
  base64: string;
};

/**
 * Saves listing images into Drive: parent / {SKU} / files
 * Uses the same Apps Script Web App as the pricing sheet (DriveApp as owner).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sku?: string;
      parentFolderId?: string;
      appsScriptUrl?: string;
      files?: UploadFile[];
    };

    const sku = String(body.sku || "")
      .trim()
      .replace(/[\\/:*?"<>|]/g, "-");
    const parentFolderId =
      String(body.parentFolderId || "").trim() || DEFAULT_DRIVE_FOLDER_ID;
    const files = Array.isArray(body.files) ? body.files : [];
    const appsScriptUrl =
      String(body.appsScriptUrl || "").trim() ||
      process.env.GOOGLE_APPS_SCRIPT_URL?.trim() ||
      process.env.NEXT_PUBLIC_APPS_SCRIPT_URL?.trim() ||
      "";

    if (!sku) {
      return NextResponse.json({ error: "SKU is required (Drive folder name)." }, { status: 400 });
    }
    if (!files.length) {
      return NextResponse.json({ error: "No images to upload." }, { status: 400 });
    }
    if (!appsScriptUrl) {
      return NextResponse.json(
        {
          error:
            "Apps Script URL missing. Set GOOGLE_APPS_SCRIPT_URL in .env.local (same Web App URL as the pricing tool).",
        },
        { status: 400 }
      );
    }

    // Keep payload reasonable — max 5 images
    const limited = files.slice(0, 5).map((f, i) => ({
      name: f.name || `${sku}-${i + 1}.jpg`,
      mimeType: f.mimeType || "image/jpeg",
      base64: String(f.base64 || "").replace(/^data:[^;]+;base64,/, ""),
    }));

    const res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "uploadProductImages",
        parentFolderId,
        sku,
        files: limited,
      }),
    });

    const text = await res.text();
    let data: {
      ok?: boolean;
      error?: string;
      folderId?: string;
      folderName?: string;
      count?: number;
      files?: { id: string; name: string; url: string }[];
      scriptVersion?: number;
    };
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error:
            "Apps Script returned non-JSON. Redeploy google-apps-script.js (v6+) with New version.",
        },
        { status: 502 }
      );
    }

    if (!data.ok) {
      return NextResponse.json(
        { error: data.error || "Drive upload failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      sku,
      folderId: data.folderId,
      folderName: data.folderName || sku,
      count: data.count || limited.length,
      files: data.files || [],
      scriptVersion: data.scriptVersion,
      message: `Saved ${data.count || limited.length} images to Drive folder “${sku}”`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
