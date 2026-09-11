import type { ExportResult, MeeshoProduct } from "./types";

function csvEscape(v: string | number) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Meesho bulk-upload style CSV.
 * Upload via Supplier Panel → Catalog → Add Bulk Catalog (after picking category template).
 *
 * Meesho’s exact headers vary by category. This starter set matches common fields;
 * after download, map columns into the official template Meesho gives for your category
 * if required — or paste image URLs into that template.
 */
export function buildMeeshoCsv(products: MeeshoProduct[]): ExportResult {
  const headers = [
    "SKU Code",
    "Product Name",
    "Product Description",
    "Category",
    "GST",
    "HSN Code",
    "MRP",
    "Selling Price",
    "Inventory",
    "Weight (g)",
    "Length (cm)",
    "Breadth (cm)",
    "Height (cm)",
    "Color",
    "Size",
    "Image URL 1",
    "Image URL 2",
    "Image URL 3",
    "Image URL 4",
    "Image URL 5",
  ];

  const lines = [headers.join(",")];
  let count = 0;
  for (const p of products) {
    if (p.status === "draft" || p.status === "skipped") continue;
    if (!(p.price > 0) || !p.name) continue;

    const dims = parseDims(p.dims);
    const imgs = [...p.imageUrls, "", "", "", "", ""].slice(0, 5);

    lines.push(
      [
        p.sku,
        p.name,
        p.description,
        p.category,
        p.gst,
        p.hsn,
        p.mrp,
        p.price,
        p.inventory,
        p.weightGrams,
        dims.length,
        dims.breadth,
        dims.height,
        p.color,
        p.size,
        ...imgs,
      ]
        .map(csvEscape)
        .join(",")
    );
    count++;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `meesho-bulk-catalog-${stamp}.csv`,
    csv: lines.join("\n"),
    count,
  };
}

function parseDims(dims: string | undefined) {
  const empty = { length: "", breadth: "", height: "" };
  if (!dims) return empty;
  const parts = String(dims)
    .toLowerCase()
    .replace(/cm/g, "")
    .split(/[x×*]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return { length: parts[0], breadth: parts[1], height: parts[2] };
  }
  if (parts.length === 1) return { length: parts[0], breadth: "", height: "" };
  return empty;
}

/** Simulated “list on Meesho” — real push needs Supplier API access or bulk upload */
export function simulateList(products: MeeshoProduct[]) {
  return products.map((p) => {
    if (p.status === "draft" || p.status === "skipped") return p;
    if (!p.name || p.price <= 0) {
      return { ...p, status: "error" as const, error: "Invalid price/name" };
    }
    return {
      ...p,
      status: "exported" as const,
      error: undefined,
    };
  });
}
