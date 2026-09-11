/** Meesho marketplace listing types */

export type MeeshoProductStatus =
  | "draft"
  | "ready"
  | "queued"
  | "exported"
  | "listed"
  | "error"
  | "skipped";

export type MeeshoProduct = {
  id: string;
  rowIndex: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  mrp: number;
  gst: number;
  hsn: string;
  inventory: number;
  weightGrams: number;
  color: string;
  size: string;
  dims: string;
  /** Drive file IDs or public URLs */
  imageUrls: string[];
  imageFolderHint: string;
  status: MeeshoProductStatus;
  error?: string;
  raw: Record<string, string>;
};

export type SheetConfig = {
  spreadsheetId: string;
  range: string;
};

export type DriveConfig = {
  folderId: string;
};

export type SyncResult = {
  mode: "live" | "mock";
  products: MeeshoProduct[];
  sheetTitle?: string;
  warning?: string;
};

export type ExportResult = {
  filename: string;
  csv: string;
  count: number;
};

/** Expected sheet headers (case-insensitive). Aliases accepted in map.ts */
export const DEFAULT_SHEET_ID =
  process.env.GOOGLE_SHEETS_ID ||
  "1HaJIjWntMd16vnSAFa9wASb_sWds2YwmrN4yGmGZ84M";

export const DEFAULT_DRIVE_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID ||
  "1wjql3Yu4fNZJNolL780WKepimVuTKPoh";

/** Default to the Pricing tab used by the pricing calculator / Apps Script */
export const DEFAULT_SHEET_RANGE =
  process.env.GOOGLE_SHEETS_RANGE || "Pricing!A1:AZ500";

export const MEESHO_SUPPLIER_URL = "https://supplier.meesho.com/";
