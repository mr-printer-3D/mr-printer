import { NextRequest, NextResponse } from "next/server";
import { buildMeeshoCsv } from "@/lib/meesho/catalog";
import type { MeeshoProduct } from "@/lib/meesho/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { products?: MeeshoProduct[] };
    if (!body.products?.length) {
      return NextResponse.json({ error: "No products to export" }, { status: 400 });
    }

    const selected = body.products.filter(
      (p) => p.status !== "skipped" && p.status !== "draft"
    );
    if (!selected.length) {
      return NextResponse.json(
        { error: "No ready products selected" },
        { status: 400 }
      );
    }

    const result = buildMeeshoCsv(selected);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
