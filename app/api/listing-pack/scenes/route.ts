import { NextRequest, NextResponse } from "next/server";
import {
  listingPackLiveEnabled,
  replicateAllScenes,
} from "@/lib/listing-pack/replicate";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { forceMock?: boolean };
    const live = listingPackLiveEnabled() && !body.forceMock;

    if (!live) {
      return NextResponse.json({
        mode: "mock",
        scenes: {},
        message: "Mock mode — templates use local lifestyle plates",
      });
    }

    try {
      const scenes = await replicateAllScenes();
      return NextResponse.json({ mode: "live", scenes });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        mode: "mock",
        scenes: {},
        warning: message,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scenes failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
