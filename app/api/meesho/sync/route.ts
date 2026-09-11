import { NextRequest, NextResponse } from "next/server";
import { attachDriveImages } from "@/lib/meesho/map";
import { listDriveImages } from "@/lib/meesho/drive";
import { fetchSheetProducts } from "@/lib/meesho/sheets";
import { appBaseUrl } from "@/lib/meesho/images";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      spreadsheetId?: string;
      range?: string;
      folderId?: string;
      forceMock?: boolean;
    };

    const sheet = await fetchSheetProducts({
      spreadsheetId: body.spreadsheetId,
      range: body.range,
      forceMock: body.forceMock,
    });

    const drive = await listDriveImages({
      folderId: body.folderId,
      forceMock: body.forceMock || sheet.mode === "mock",
    });

    const baseUrl = appBaseUrl(req.nextUrl.origin);
    const products = attachDriveImages(sheet.products, drive.files, { baseUrl });
    const warnings = [sheet.warning, drive.warning].filter(Boolean);
    const withImages = products.filter((p) => p.imageUrls.length > 0).length;

    return NextResponse.json({
      mode: sheet.mode === "live" && drive.mode === "live" ? "live" : sheet.mode,
      sheetTitle: sheet.sheetTitle,
      driveFileCount: drive.files.length,
      productsWithImages: withImages,
      imageBaseUrl: baseUrl,
      products,
      warning: warnings.join(" · ") || undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
