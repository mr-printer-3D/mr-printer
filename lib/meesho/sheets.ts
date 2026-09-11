import { rowsToProducts } from "./map";
import { mockSync } from "./mock";
import type { SyncResult } from "./types";
import { DEFAULT_SHEET_ID, DEFAULT_SHEET_RANGE } from "./types";

function apiKey() {
  return process.env.GOOGLE_API_KEY?.trim() || "";
}

export function googleLiveEnabled() {
  return Boolean(apiKey());
}

/** Fetch sheet values via Google Sheets API v4 */
export async function fetchSheetProducts(opts?: {
  spreadsheetId?: string;
  range?: string;
  forceMock?: boolean;
}): Promise<SyncResult> {
  if (opts?.forceMock || !googleLiveEnabled()) {
    return mockSync();
  }

  const spreadsheetId = opts?.spreadsheetId || DEFAULT_SHEET_ID;
  const range = opts?.range || DEFAULT_SHEET_RANGE;
  const key = apiKey();

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(range)}?key=${encodeURIComponent(key)}`;

  const metaUrl =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `?fields=properties.title&key=${encodeURIComponent(key)}`;

  try {
    const [valuesRes, metaRes] = await Promise.all([
      fetch(url, { next: { revalidate: 0 } }),
      fetch(metaUrl, { next: { revalidate: 0 } }),
    ]);

    if (!valuesRes.ok) {
      const errText = await valuesRes.text();
      return {
        ...mockSync(),
        warning: `Sheets API ${valuesRes.status}: ${errText.slice(0, 200)}. Using mock data.`,
      };
    }

    const json = (await valuesRes.json()) as { values?: string[][] };
    const values = json.values || [];
    if (values.length < 2) {
      return {
        mode: "live",
        products: [],
        warning: "Sheet has no data rows (need header + at least 1 product).",
      };
    }

    const [headers, ...rows] = values;
    const products = rowsToProducts(headers, rows);

    let sheetTitle = "Google Sheet";
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as {
        properties?: { title?: string };
      };
      sheetTitle = meta.properties?.title || sheetTitle;
    }

    return { mode: "live", products, sheetTitle };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...mockSync(),
      warning: `Sheet fetch failed: ${message}`,
    };
  }
}
