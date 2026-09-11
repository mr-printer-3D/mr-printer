import { NextRequest, NextResponse } from "next/server";
import { simulateList } from "@/lib/meesho/catalog";
import type { MeeshoProduct } from "@/lib/meesho/types";

export const runtime = "nodejs";

/**
 * Meesho does not offer a public open listing API for most sellers.
 * Official path = bulk CSV upload in Supplier Panel.
 * If MEESHO_API_KEY + approved supplier API exist later, plug in here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { products?: MeeshoProduct[] };
    if (!body.products?.length) {
      return NextResponse.json({ error: "No products" }, { status: 400 });
    }

    const apiKey = process.env.MEESHO_API_KEY?.trim();
    if (apiKey) {
      // Placeholder for approved Supplier API — do not invent unauthorized endpoints
      return NextResponse.json({
        mode: "api_pending",
        message:
          "MEESHO_API_KEY is set, but live Meesho Supplier API wiring needs your approved endpoint docs from Meesho. Export CSV for now.",
        products: simulateList(body.products),
      });
    }

    return NextResponse.json({
      mode: "export_ready",
      message:
        "Products marked ready for Meesho bulk upload. Download CSV → Supplier Panel → Catalog → Bulk Upload.",
      products: simulateList(body.products),
      supplierPanel: "https://supplier.meesho.com/",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "List failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
