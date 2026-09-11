import { NextRequest, NextResponse } from "next/server";
import {
  listingPackLiveEnabled,
  replicateCutout,
} from "@/lib/listing-pack/replicate";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { imageDataUrl?: string; forceMock?: boolean };
    if (!body.imageDataUrl?.startsWith("data:image/")) {
      return NextResponse.json({ error: "imageDataUrl required" }, { status: 400 });
    }

    const live = listingPackLiveEnabled() && !body.forceMock;
    if (!live) {
      return NextResponse.json({
        mode: "mock",
        cutoutDataUrl: null,
        message: "Mock mode — client will run local cutout",
      });
    }

    try {
      const cutoutDataUrl = await replicateCutout(body.imageDataUrl);
      return NextResponse.json({ mode: "live", cutoutDataUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[listing-pack/cutout]", message);
      // Soft-fail to mock so UI never blocks
      return NextResponse.json({
        mode: "mock",
        cutoutDataUrl: null,
        warning: message,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cutout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
