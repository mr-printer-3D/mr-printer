import type { MeeshoProduct } from "./types";
import { publicDriveImageUrl } from "./images";
import type { DriveFile } from "./drive";

function norm(h: string) {
  return h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

/** Map flexible sheet headers → canonical keys (includes Pricing sheet camelCase) */
const ALIASES: Record<string, string[]> = {
  sku: ["sku", "sku_code", "product_sku", "item_code", "code", "mrp_sku"],
  name: [
    "name",
    "product_name",
    "title",
    "product_title",
    "listing_title",
    "item_name",
  ],
  description: ["description", "desc", "product_description", "details", "dims"],
  category: [
    "collections",
    "collection",
    "category",
    "meesho_category",
    "cat",
    "product_category",
  ],
  /** Prefer Meesho listing price, then selling price from pricing tool */
  price: [
    "meesho",
    "meesho_price",
    "meesho_selling_price",
    "sellingprice",
    "selling_price",
    "price",
    "sale_price",
    "sp",
    "sell_price",
    "finaltotalcost", // never preferred first — listed late as last resort only via sellingprice
  ],
  mrp: ["mrp", "max_retail_price", "retail_price"],
  gst: ["gst", "gst_percent", "gst_", "tax"],
  hsn: ["hsn", "hsn_code", "hsn_sac"],
  inventory: [
    "inventorytotal",
    "inventory_total",
    "inventory",
    "stock",
    "qty",
    "quantity",
    "available",
    "inventoryritesh",
    "inventory_ritesh",
  ],
  inventoryRitesh: ["inventoryritesh", "inventory_ritesh", "ritesh"],
  inventoryMayuri: ["inventorymayuri", "inventory_mayuri", "mayuri"],
  weightGrams: [
    "weight",
    "weight_g",
    "weight_grams",
    "grams",
    "net_weight",
  ],
  color: ["color", "colour", "variant_color", "colors"],
  size: ["size", "variant", "variation"],
  dims: ["dims", "dimensions", "size_cm"],
  imageFolderHint: [
    "images",
    "image_folder",
    "drive_folder",
    "folder",
    "image_path",
    "photos",
  ],
  image1: ["image1", "image_1", "image_url", "image", "main_image"],
  image2: ["image2", "image_2"],
  image3: ["image3", "image_3"],
  image4: ["image4", "image_4"],
};

function pick(row: Record<string, string>, canonical: string): string {
  const aliases = ALIASES[canonical] || [canonical];
  for (const a of aliases) {
    if (row[a] !== undefined && String(row[a]).trim() !== "") {
      return String(row[a]).trim();
    }
  }
  return "";
}

function num(v: string, fallback = 0) {
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

/** Prefer Meesho price column, then sellingPrice from pricing sheet */
function pickPrice(row: Record<string, string>): number {
  const candidates = [
    row.meesho,
    row.meesho_price,
    row.meesho_selling_price,
    row.sellingprice,
    row.selling_price,
    row.price,
    row.sale_price,
    row.sp,
    row.sell_price,
  ];
  for (const c of candidates) {
    if (c !== undefined && String(c).trim() !== "") {
      const n = num(String(c));
      if (n > 0) return Math.round(n);
    }
  }
  return 0;
}

function parseColor(raw: string): string {
  if (!raw) return "Multi";
  const t = raw.trim();
  if (t.startsWith("[")) {
    try {
      const arr = JSON.parse(t) as { name?: string }[];
      if (Array.isArray(arr) && arr.length) {
        const names = arr.map((c) => c?.name).filter(Boolean);
        if (names.length) return names.join(" / ");
      }
    } catch {
      /* ignore */
    }
  }
  return t || "Multi";
}

function parseInventory(row: Record<string, string>): number {
  const total = pick(row, "inventory");
  if (total) return Math.max(0, Math.floor(num(total)));
  const r = num(pick(row, "inventoryRitesh"));
  const m = num(pick(row, "inventoryMayuri"));
  if (r + m > 0) return Math.floor(r + m);
  return 0;
}

export function headersToKeys(headers: string[]) {
  return headers.map((h) => norm(h));
}

export function validateProduct(p: MeeshoProduct): MeeshoProduct {
  const issues: string[] = [];
  if (!p.name?.trim()) issues.push("Missing name");
  if (!(p.price > 0)) issues.push("Missing Meesho/selling price");
  if (!(p.mrp > 0)) issues.push("Missing MRP");
  if (p.mrp > 0 && p.price > 0 && p.price > p.mrp) {
    issues.push("Selling price above MRP");
  }
  if (p.inventory <= 0) issues.push("Zero stock");
  if (!p.imageUrls.length) issues.push("No images");

  const canExport = Boolean(p.name && p.price > 0 && p.mrp > 0);

  return {
    ...p,
    status: canExport ? (p.status === "exported" ? "exported" : "ready") : "draft",
    error: issues.length ? issues.join(" · ") : undefined,
  };
}

export function rowsToProducts(
  headers: string[],
  rows: string[][]
): MeeshoProduct[] {
  const keys = headersToKeys(headers);
  const products: MeeshoProduct[] = [];

  rows.forEach((cells, i) => {
    const raw: Record<string, string> = {};
    keys.forEach((k, j) => {
      raw[k] = String(cells[j] ?? "").trim();
    });

    const name = pick(raw, "name");
    const sku = pick(raw, "sku") || `MRP-${i + 1}`;
    // Skip fully empty rows
    if (!name && !pickPrice(raw) && !num(pick(raw, "mrp"))) return;

    const images = [
      pick(raw, "image1"),
      pick(raw, "image2"),
      pick(raw, "image3"),
      pick(raw, "image4"),
    ].filter(Boolean);

    const price = pickPrice(raw);
    const mrp = num(pick(raw, "mrp"), price);
    const dims = pick(raw, "dims");
    const description =
      pick(raw, "description") ||
      (dims ? `3D printed · ${dims}` : "3D printed product from Mr. Printer Studio");

    const collectionsRaw = pick(raw, "category");
    let category = "Home Decor";
    if (collectionsRaw) {
      if (collectionsRaw.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(collectionsRaw);
          if (Array.isArray(parsed) && parsed.length) {
            category = String(parsed[0]).trim() || category;
          }
        } catch {
          category = collectionsRaw.split(/[;,|]/)[0]?.trim() || category;
        }
      } else {
        category = collectionsRaw.split(/[;,|]/)[0]?.trim() || collectionsRaw;
      }
    }

    const product: MeeshoProduct = {
      id: `${sku}-${i}`,
      rowIndex: i + 2,
      sku,
      name: name || "Untitled product",
      description,
      category,
      price,
      mrp: mrp || price,
      gst: num(pick(raw, "gst"), 18),
      hsn: pick(raw, "hsn") || "3926",
      inventory: parseInventory(raw),
      weightGrams: Math.max(1, Math.floor(num(pick(raw, "weightGrams"), 50))),
      color: parseColor(pick(raw, "color")),
      size: pick(raw, "size") || "Free Size",
      dims,
      imageUrls: images,
      imageFolderHint: pick(raw, "imageFolderHint") || sku || name,
      status: "draft",
      raw,
    };

    products.push(validateProduct(product));
  });

  return products;
}

export function attachDriveImages(
  products: MeeshoProduct[],
  driveFiles: DriveFile[],
  opts?: { baseUrl?: string }
) {
  const baseUrl = opts?.baseUrl || "";

  return products.map((p) => {
    let next = p;

    // Sheet already has http(s) image URLs — keep them
    const sheetUrls = p.imageUrls.filter((u) => /^https?:\/\//i.test(u));

    const hint = (p.imageFolderHint || p.sku || p.name).toLowerCase();
    const skuLower = p.sku.toLowerCase();
    const matched = driveFiles.filter((f) => {
      const n = f.name.toLowerCase();
      const folder = (f.skuFolder || "").toLowerCase();
      return (
        folder === skuLower ||
        n.startsWith(skuLower + "/") ||
        n.includes(hint) ||
        n.includes(skuLower) ||
        hint.split(/[\s_\-]+/).some((t) => t.length > 2 && n.includes(t))
      );
    });

    // Prefer public app proxy URLs so Meesho can download from Drive
    const driveUrls = matched.slice(0, 5).map((f) => {
      if (baseUrl) return publicDriveImageUrl(f.id, baseUrl);
      return (
        f.webContentLink ||
        `https://drive.google.com/uc?export=view&id=${f.id}`
      );
    });

    const urls = [...sheetUrls, ...driveUrls].filter(Boolean).slice(0, 5);
    next = { ...p, imageUrls: urls };
    return validateProduct(next);
  });
}
