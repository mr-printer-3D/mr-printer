import { NextRequest, NextResponse } from "next/server";
import { buildShopifyCsv } from "@/lib/shopify/catalog";
import type { MeeshoProduct } from "@/lib/meesho/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { products?: MeeshoProduct[] };
    if (!body.products?.length) {
      return NextResponse.json({ error: "No products to export" }, { status: 400 });
    }

    const selected = body.products.filter(
      (p) => p && p.status !== "draft" && p.status !== "skipped"
    );
    if (!selected.length) {
      return NextResponse.json(
        { error: "No ready products selected (draft/skipped excluded)." },
        { status: 400 }
      );
    }

    const result = buildShopifyCsv(selected);
    if (!result.count) {
      return NextResponse.json(
        { error: "Nothing to export — need name + price > 0." },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
