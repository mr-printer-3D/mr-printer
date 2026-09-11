"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckSquare,
  Download,
  ExternalLink,
  ImageIcon,
  Loader2,
  RefreshCw,
  Send,
  Sheet,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MeeshoProduct } from "@/lib/meesho/types";
import {
  DEFAULT_DRIVE_FOLDER_ID,
  DEFAULT_SHEET_ID,
  DEFAULT_SHEET_RANGE,
  MEESHO_SUPPLIER_URL,
} from "@/lib/meesho/types";

const STEPS = ["Connect", "Sync", "Review", "Export / List"] as const;

type FilterMode = "all" | "ready" | "issues";

export function MeeshoPanel() {
  const [step, setStep] = useState(0);
  const [spreadsheetId, setSpreadsheetId] = useState(DEFAULT_SHEET_ID);
  const [range, setRange] = useState(DEFAULT_SHEET_RANGE);
  const [folderId, setFolderId] = useState(DEFAULT_DRIVE_FOLDER_ID);
  const [forceMock, setForceMock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "mock">("mock");
  const [sheetTitle, setSheetTitle] = useState<string>("");
  const [driveCount, setDriveCount] = useState(0);
  const [products, setProducts] = useState<MeeshoProduct[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterMode>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "ready" && p.status === "draft") return false;
      if (filter === "issues" && !p.error) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q)
      );
    });
  }, [products, filter, query]);

  const readyCount = useMemo(
    () =>
      products.filter(
        (p) => selected[p.id] !== false && p.status !== "draft"
      ).length,
    [products, selected]
  );

  const issueCount = useMemo(
    () => products.filter((p) => p.error).length,
    [products]
  );

  const sync = useCallback(async () => {
    setBusy(true);
    setError(null);
    setWarning(null);
    setStep(1);
    setStatus("Fetching Google Sheet + Drive…");
    try {
      const res = await fetch("/api/meesho/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId,
          range,
          folderId,
          forceMock,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync failed");

      setMode(json.mode === "live" ? "live" : "mock");
      setSheetTitle(json.sheetTitle || "");
      setDriveCount(json.driveFileCount || 0);
      setProducts(json.products || []);
      const sel: Record<string, boolean> = {};
      for (const p of json.products || []) {
        sel[p.id] = p.status === "ready" || p.status === "exported";
      }
      setSelected(sel);
      if (json.warning) setWarning(String(json.warning));
      setStep(2);
      setStatus(`Synced ${json.products?.length || 0} rows`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setStatus("Error");
    } finally {
      setBusy(false);
    }
  }, [spreadsheetId, range, folderId, forceMock]);

  function applyPricingPreset() {
    setSpreadsheetId(DEFAULT_SHEET_ID);
    setRange("Pricing!A1:AZ500");
    setFolderId(DEFAULT_DRIVE_FOLDER_ID);
    setForceMock(false);
    setStatus("Preset: Pricing sheet");
  }

  function selectAllReady() {
    const next: Record<string, boolean> = { ...selected };
    for (const p of products) {
      next[p.id] = p.status !== "draft";
    }
    setSelected(next);
  }

  function selectNone() {
    const next: Record<string, boolean> = {};
    for (const p of products) next[p.id] = false;
    setSelected(next);
  }

  async function exportCsv() {
    const picked = products.filter((p) => selected[p.id] !== false);
    setBusy(true);
    setStatus("Building Meesho CSV…");
    setError(null);
    try {
      const res = await fetch("/api/meesho/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: picked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Export failed");

      const blob = new Blob([json.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = json.filename;
      a.click();
      URL.revokeObjectURL(url);

      setProducts((prev) =>
        prev.map((p) =>
          selected[p.id] !== false && p.status !== "draft"
            ? { ...p, status: "exported" }
            : p
        )
      );
      setStep(3);
      setStatus(`Exported ${json.count} products (Meesho)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  async function exportShopifyCsv() {
    const picked = products.filter((p) => selected[p.id] !== false);
    setBusy(true);
    setStatus("Building Shopify product CSV…");
    setError(null);
    try {
      const res = await fetch("/api/shopify/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: picked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Shopify export failed");

      const blob = new Blob([json.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = json.filename;
      a.click();
      URL.revokeObjectURL(url);

      setProducts((prev) =>
        prev.map((p) =>
          selected[p.id] !== false && p.status !== "draft"
            ? { ...p, status: "exported" }
            : p
        )
      );
      setStep(3);
      setStatus(`Exported ${json.count} products (Shopify)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Shopify export failed");
    } finally {
      setBusy(false);
    }
  }

  async function queueList() {
    const picked = products.filter((p) => selected[p.id] !== false);
    setBusy(true);
    setStatus("Preparing Meesho list…");
    try {
      const res = await fetch("/api/meesho/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: picked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "List failed");
      setProducts(json.products || picked);
      setStep(3);
      setStatus(json.message || "Ready");
      if (json.supplierPanel) {
        window.open(json.supplierPanel, "_blank", "noopener");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "List failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[radial-gradient(ellipse_at_top,#ecfdf5_0%,#f8fafc_40%,#f1f5f9_100%)]">
      <header className="sticky top-0 z-20 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
              Meesho Marketplace
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">
              Pricing sheet + Drive → review → Meesho / Shopify CSV
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Studio
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  i === step
                    ? "bg-emerald-800 text-white"
                    : i < step
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-100 text-stone-500"
                )}
              >
                {i + 1}. {s}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={applyPricingPreset}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            Use Pricing sheet defaults
          </button>

          <label className="block text-xs font-semibold text-stone-600">
            Google Sheet ID
            <input
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value.trim())}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-xs"
            />
          </label>

          <label className="block text-xs font-semibold text-stone-600">
            Range
            <input
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-xs"
              placeholder="Pricing!A1:AZ500"
            />
          </label>

          <label className="block text-xs font-semibold text-stone-600">
            Drive folder ID
            <input
              value={folderId}
              onChange={(e) => setFolderId(e.target.value.trim())}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-xs"
            />
          </label>

          <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <input
              type="checkbox"
              checked={forceMock}
              onChange={(e) => setForceMock(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>Force mock</strong> — demo products without Google API
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {warning && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {warning}
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => void sync()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {busy ? status : "Sync Sheet + Drive"}
          </button>

          {products.length > 0 && (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllReady}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-stone-200 px-2 py-2 text-[11px] font-semibold text-stone-700"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  Ready
                </button>
                <button
                  type="button"
                  onClick={selectNone}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-stone-200 px-2 py-2 text-[11px] font-semibold text-stone-700"
                >
                  <Square className="h-3.5 w-3.5" />
                  None
                </button>
              </div>
              <button
                type="button"
                disabled={busy || readyCount === 0}
                onClick={() => void exportCsv()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-900 text-sm font-semibold text-stone-900 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download Meesho CSV ({readyCount})
              </button>
              <button
                type="button"
                disabled={busy || readyCount === 0}
                onClick={() => void exportShopifyCsv()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#95BF47] bg-[#f4f9ec] text-sm font-semibold text-[#2d3b1a] disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Download Shopify CSV ({readyCount})
              </button>
              <button
                type="button"
                disabled={busy || readyCount === 0}
                onClick={() => void queueList()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-50 text-sm font-semibold text-emerald-900 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Mark ready + open Supplier Panel
              </button>
            </>
          )}

          <a
            href={MEESHO_SUPPLIER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 text-xs font-semibold text-emerald-800 hover:underline"
          >
            Meesho Supplier Panel <ExternalLink className="h-3 w-3" />
          </a>

          <p className="text-center text-[11px] text-stone-500">
            Mode: {mode}
            {sheetTitle ? ` · ${sheetTitle}` : ""}
            {driveCount ? ` · ${driveCount} Drive images` : ""}
            {issueCount ? ` · ${issueCount} with notes` : ""}
          </p>
          <p className="text-center text-[10px] leading-snug text-stone-400">
            Drive images use /api/meesho/image/… in CSV. Shopify CSV matches Admin product
            import template — upload in Shopify Admin → Products → Import.
          </p>
        </aside>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
              <Sheet className="h-4 w-4 text-emerald-700" />
              Listing queue
            </div>
            <p className="text-xs text-stone-500">{status}</p>
          </div>

          {products.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or SKU…"
                className="min-w-[180px] flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
              {(["all", "ready", "issues"] as FilterMode[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
                    filter === f
                      ? "bg-emerald-800 text-white"
                      : "bg-stone-100 text-stone-600"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-stone-50 px-6 text-center text-sm text-stone-500">
              <p className="font-semibold text-stone-700">No products synced yet</p>
              <p className="mt-2 max-w-md">
                Default range is <code className="font-mono text-xs">Pricing!A1:AZ500</code>{" "}
                — same sheet as the pricing calculator. Sync, review, download CSV, then
                upload in Supplier Panel.
              </p>
              <p className="mt-4 text-xs">
                Tip: use <strong>Force mock</strong> to preview, or add{" "}
                <code className="font-mono">GOOGLE_API_KEY</code> in{" "}
                <code className="font-mono">.env.local</code> for live data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                    <th className="px-2 py-2">Use</th>
                    <th className="px-2 py-2">Img</th>
                    <th className="px-2 py-2">SKU</th>
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Meesho ₹</th>
                    <th className="px-2 py-2">MRP</th>
                    <th className="px-2 py-2">Stock</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((p) => (
                    <tr key={p.id} className="border-b border-stone-100 align-top">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selected[p.id] !== false}
                          disabled={p.status === "draft"}
                          onChange={(e) =>
                            setSelected((s) => ({
                              ...s,
                              [p.id]: e.target.checked,
                            }))
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        {p.imageUrls[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrls[0]}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover ring-1 ring-stone-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 font-mono text-xs">{p.sku}</td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-stone-900">{p.name}</div>
                        <div className="text-[11px] text-stone-500">
                          {p.color}
                          {p.dims ? ` · ${p.dims}` : ""}
                        </div>
                        {p.error && (
                          <div className="mt-0.5 text-[11px] text-amber-700">
                            {p.error}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 font-semibold">₹{p.price}</td>
                      <td className="px-2 py-2">₹{p.mrp}</td>
                      <td className="px-2 py-2">{p.inventory}</td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            p.status === "ready" &&
                              "bg-emerald-100 text-emerald-800",
                            p.status === "exported" &&
                              "bg-sky-100 text-sky-800",
                            p.status === "draft" &&
                              "bg-stone-100 text-stone-500",
                            p.status === "error" && "bg-red-100 text-red-700"
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visible.length && (
                <p className="py-8 text-center text-sm text-stone-500">
                  No rows match this filter.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs leading-relaxed text-stone-600">
            <p className="font-semibold text-stone-800">How listing works</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>
                Keep products in the <strong>Pricing</strong> Google Sheet (same as
                the pricing tool). Meesho price uses the <code>meesho</code> column
                when set, else selling price.
              </li>
              <li>
                Put listing images in the Drive folder (name files with{" "}
                <strong>SKU</strong>). Sync attaches them and puts{" "}
                <strong>public image URLs</strong> into the CSV so Meesho can
                download them from this app.
              </li>
              <li>Sync here → review → download <strong>Meesho CSV</strong> or <strong>Shopify CSV</strong>.</li>
              <li>
                Meesho: upload in{" "}
                <a
                  className="font-semibold text-emerald-800 underline"
                  href={MEESHO_SUPPLIER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supplier Panel → Catalog → Bulk Upload
                </a>
                . Shopify: Admin → Products → Import (same columns as Shopify’s product template).
              </li>
            </ol>
            <p className="mt-2">
              Meesho has no public auto-list API for most sellers — bulk CSV is the
              supported path. Shopify CSV matches the official product import template.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
