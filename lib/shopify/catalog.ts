import type { ExportResult, MeeshoProduct } from "@/lib/meesho/types";

/** Exact headers from Shopify Admin → Products → Export / product_template.csv */
export const SHOPIFY_PRODUCT_HEADERS = [
  "Title",
  "URL handle",
  "Description",
  "Vendor",
  "Product category",
  "Type",
  "Tags",
  "Published on online store",
  "Status",
  "SKU",
  "Barcode",
  "Option1 name",
  "Option1 value",
  "Option1 Linked To",
  "Option2 name",
  "Option2 value",
  "Option2 Linked To",
  "Option3 name",
  "Option3 value",
  "Option3 Linked To",
  "Price",
  "Compare-at price",
  "Cost per item",
  "Charge tax",
  "Tax code",
  "Unit price total measure",
  "Unit price total measure unit",
  "Unit price base measure",
  "Unit price base measure unit",
  "Inventory tracker",
  "Inventory quantity",
  "Continue selling when out of stock",
  "Weight value (grams)",
  "Weight unit for display",
  "Requires shipping",
  "Fulfillment service",
  "Product image URL",
  "Image position",
  "Image alt text",
  "Variant image URL",
  "Gift card",
  "SEO title",
  "SEO description",
  "Color (product.metafields.shopify.color-pattern)",
  "Google Shopping / Google product category",
  "Google Shopping / Gender",
  "Google Shopping / Age group",
  "Google Shopping / Manufacturer part number (MPN)",
  "Google Shopping / Ad group name",
  "Google Shopping / Ads labels",
  "Google Shopping / Condition",
  "Google Shopping / Custom product",
  "Google Shopping / Custom label 0",
  "Google Shopping / Custom label 1",
  "Google Shopping / Custom label 2",
  "Google Shopping / Custom label 3",
  "Google Shopping / Custom label 4",
] as const;

function csvEscape(v: string | number | boolean) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function slugify(input: string) {
  return String(input || "product")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";
}

function emptyRow(): string[] {
  return SHOPIFY_PRODUCT_HEADERS.map(() => "");
}

function set(row: string[], key: (typeof SHOPIFY_PRODUCT_HEADERS)[number], value: string | number | boolean) {
  const i = SHOPIFY_PRODUCT_HEADERS.indexOf(key);
  if (i >= 0) row[i] = String(value ?? "");
}

function costFromRaw(p: MeeshoProduct) {
  const raw = p.raw || {};
  const keys = ["finalTotalCost", "finaltotalcost", "cost", "materialCost"];
  for (const k of keys) {
    const v = Number(raw[k]);
    if (Number.isFinite(v) && v > 0) return v.toFixed(2);
  }
  return "";
}

function colorList(p: MeeshoProduct) {
  const fromField = String(p.color || "")
    .split(/[;|,/]/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (fromField.length) return fromField;
  return ["Default Title"];
}

/**
 * Build Shopify product import CSV (same columns as product_template.csv).
 * - One primary variant row per product
 * - Extra rows for additional images (same URL handle)
 * - If multiple colors, one variant row per color
 */
export function buildShopifyCsv(products: MeeshoProduct[]): ExportResult {
  const lines = [SHOPIFY_PRODUCT_HEADERS.join(",")];
  let count = 0;

  for (const p of products) {
    if (p.status === "draft" || p.status === "skipped") continue;
    if (!(p.price > 0) || !p.name) continue;

    const handle = slugify(p.sku || p.name);
    const colors = colorList(p);
    const useColorOption = !(colors.length === 1 && colors[0] === "Default Title");
    const images = (p.imageUrls || []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 5);
    const price = Number(p.price).toFixed(2);
    const compare = p.mrp > p.price ? Number(p.mrp).toFixed(2) : "";
    const cost = costFromRaw(p);
    const tags = ["3D Print", "Mr Printer", p.category].filter(Boolean).join(", ");
    const seoTitle = p.name.slice(0, 70);
    const seoDesc = (p.description || p.name).slice(0, 320);
    const colorMeta = useColorOption ? colors.join("; ") : "";

    colors.forEach((color, vi) => {
      const row = emptyRow();
      const isFirst = vi === 0;
      if (isFirst) {
        set(row, "Title", p.name);
        set(row, "Description", p.description || `3D printed · ${p.dims || p.name}`);
        set(row, "Vendor", "Mr. Printer Studio");
        set(row, "Product category", "Home & Garden > Decor");
        set(row, "Type", p.category || "3D Printed");
        set(row, "Tags", tags);
        set(row, "Published on online store", "TRUE");
        set(row, "Status", "Active");
        set(row, "SEO title", seoTitle);
        set(row, "SEO description", seoDesc);
        set(row, "Color (product.metafields.shopify.color-pattern)", colorMeta);
        set(row, "Google Shopping / Condition", "New");
        set(row, "Google Shopping / Custom product", "FALSE");
        if (images[0]) {
          set(row, "Product image URL", images[0]);
          set(row, "Image position", "1");
          set(row, "Image alt text", p.name);
        }
      }

      set(row, "URL handle", handle);
      set(row, "SKU", colors.length > 1 ? `${p.sku}-${slugify(color).slice(0, 12)}` : p.sku);
      if (useColorOption) {
        set(row, "Option1 name", "Color");
        set(row, "Option1 value", color);
        set(row, "Option1 Linked To", "product.metafields.shopify.color-pattern");
      } else {
        set(row, "Option1 name", "Title");
        set(row, "Option1 value", "Default Title");
      }
      set(row, "Price", price);
      set(row, "Compare-at price", compare);
      set(row, "Cost per item", cost);
      set(row, "Charge tax", "TRUE");
      set(row, "Inventory tracker", "shopify");
      set(row, "Inventory quantity", Math.max(0, Math.floor(p.inventory || 0)));
      set(row, "Continue selling when out of stock", "DENY");
      set(row, "Weight value (grams)", Math.max(1, Math.floor(p.weightGrams || 50)));
      set(row, "Weight unit for display", "g");
      set(row, "Requires shipping", "TRUE");
      set(row, "Fulfillment service", "manual");
      set(row, "Gift card", "FALSE");

      lines.push(row.map(csvEscape).join(","));
    });

    // Extra image rows (Shopify attaches by URL handle + position)
    images.slice(1).forEach((url, idx) => {
      const row = emptyRow();
      set(row, "URL handle", handle);
      set(row, "Product image URL", url);
      set(row, "Image position", String(idx + 2));
      set(row, "Image alt text", `${p.name} ${idx + 2}`);
      lines.push(row.map(csvEscape).join(","));
    });

    count++;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `shopify-products-${stamp}.csv`,
    csv: lines.join("\n"),
    count,
  };
}
