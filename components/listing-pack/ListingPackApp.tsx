"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  CloudUpload,
  Download,
  ImagePlus,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { localCutout } from "@/lib/listing-pack/cutout-client";
import { buildColorVariants } from "@/lib/listing-pack/color";
import {
  renderAllShots,
  renderMarketplaceShots,
} from "@/lib/listing-pack/templates";
import {
  DEFAULT_COPY,
  SHOT_META,
  type GeneratedShot,
  type PackCopy,
} from "@/lib/listing-pack/types";
import { DEFAULT_DRIVE_FOLDER_ID } from "@/lib/meesho/types";

const STEPS = [
  "Upload",
  "Cutout",
  "Colors",
  "Scenes",
  "Compose",
  "Preview",
] as const;

const APPS_SCRIPT_DEFAULT =
  process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbyXDWFwa_m9LpCafNlMGptzHxpSY7JSQmnlK9D7cmPgyEVb5e2QtzMDQFh5jnZ7X6qHJA/exec";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function readJson<T extends Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.status === 404
        ? "API route missing (404). Restart npm run dev from the pricing-tool folder."
        : `Server returned non-JSON (HTTP ${res.status}). Try refreshing or restarting the dev server.`
    );
  }
}

function sanitizeSku(v: string) {
  return v.trim().replace(/[\\/:*?"<>|]/g, "-");
}

export function ListingPackApp() {
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [cutout, setCutout] = useState<string | null>(null);
  const [forceMock, setForceMock] = useState(false);
  const [packSize, setPackSize] = useState<"5" | "8">("5");
  const [sku, setSku] = useState("");
  const [mode, setMode] = useState<"live" | "mock">("mock");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);
  const [copy, setCopy] = useState<PackCopy>(DEFAULT_COPY);
  const [shots, setShots] = useState<GeneratedShot[]>([]);
  const [activeShot, setActiveShot] = useState(0);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) {
      setError("Use PNG, JPEG, or WebP.");
      return;
    }
    setError(null);
    setSource(await fileToDataUrl(file));
    setCutout(null);
    setShots([]);
    setStep(0);
  }, []);

  async function runPipeline() {
    if (!source) {
      setError("Upload a product photo first.");
      return;
    }
    setBusy(true);
    setError(null);
    setWarning(null);
    setShots([]);

    try {
      // 1) Cutout
      setStep(1);
      setStatus("Removing background…");
      let cutoutUrl: string | null = null;
      let runMode: "live" | "mock" = "mock";

      if (!forceMock) {
        try {
          const cutRes = await fetch("/api/listing-pack/cutout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageDataUrl: source, forceMock }),
          });
          const cutJson = await readJson<{
            cutoutDataUrl?: string | null;
            mode?: string;
            warning?: string;
          }>(cutRes);
          if (cutRes.ok && cutJson.cutoutDataUrl) {
            cutoutUrl = cutJson.cutoutDataUrl as string;
            runMode = cutJson.mode === "live" ? "live" : "mock";
          } else if (cutJson.warning) {
            setWarning(String(cutJson.warning));
          }
        } catch {
          // Fall through to local cutout
        }
      }

      if (!cutoutUrl) {
        setStatus("AI cutout (local, first run may download models)…");
        cutoutUrl = await localCutout(source);
      }
      setCutout(cutoutUrl);
      setMode(runMode);

      // 2) Color variants
      setStep(2);
      setStatus("Building color variants…");
      const variants = await buildColorVariants(cutoutUrl);

      // 3) Scene plates
      setStep(3);
      setStatus(
        runMode === "live"
          ? "Generating lifestyle scenes (may take a minute)…"
          : "Using local lifestyle plates…"
      );
      let scenes: Record<string, string> = {};
      try {
        const sceneRes = await fetch("/api/listing-pack/scenes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceMock: forceMock || runMode === "mock" }),
        });
        const sceneJson = await readJson<{
          scenes?: Record<string, string>;
          warning?: string;
        }>(sceneRes);
        scenes = sceneJson.scenes || {};
        if (sceneJson.warning) setWarning(String(sceneJson.warning));
      } catch {
        scenes = {};
      }

      // 4) Compose pack
      setStep(4);
      setStatus(
        packSize === "5"
          ? "Composing 5 marketplace images (2000×2000)…"
          : "Composing 8-image listing pack…"
      );
      const pack =
        packSize === "5"
          ? await renderMarketplaceShots({
              cutout: cutoutUrl,
              variants,
              copy,
              scenes,
            })
          : await renderAllShots({
              cutout: cutoutUrl,
              variants,
              copy,
              scenes,
            });
      setShots(pack);
      setActiveShot(0);
      setStep(5);
      setStatus(
        `Pack ready · ${pack.length} shots · ${runMode === "live" ? "Replicate + canvas" : "local"}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
      setStatus("Error");
    } finally {
      setBusy(false);
    }
  }

  async function recompose() {
    if (!cutout) return;
    setBusy(true);
    setStatus("Updating text overlays…");
    try {
      const variants = await buildColorVariants(cutout);
      const pack =
        packSize === "5"
          ? await renderMarketplaceShots({
              cutout,
              variants,
              copy,
              scenes: {},
            })
          : await renderAllShots({
              cutout,
              variants,
              copy,
              scenes: {},
            });
      setShots(pack);
      setStatus("Overlays updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recompose failed");
    } finally {
      setBusy(false);
    }
  }

  async function downloadZip() {
    if (!shots.length) return;
    const code = sanitizeSku(sku) || copy.productName.replace(/\s+/g, "-") || "listing";
    const zip = new JSZip();
    const folder = zip.folder(code);
    shots.forEach((shot, i) => {
      const b64 = shot.dataUrl.split(",")[1];
      const name = `${code}-${i + 1}-${shot.id}.jpg`;
      folder?.file(name, b64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${code}-listing-images.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveToDrive() {
    const code = sanitizeSku(sku);
    if (!code) {
      setError("Enter product SKU first — Drive folder will be named with that SKU.");
      return;
    }
    if (!shots.length) {
      setError("Generate images first.");
      return;
    }
    setBusy(true);
    setDriveMsg(null);
    setError(null);
    setStatus(`Uploading to Drive / ${code} …`);
    try {
      const files = shots.map((shot, i) => ({
        name: `${code}-${i + 1}-${shot.id}.jpg`,
        mimeType: "image/jpeg",
        base64: shot.dataUrl,
      }));
      const res = await fetch("/api/listing-pack/upload-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: code,
          parentFolderId: DEFAULT_DRIVE_FOLDER_ID,
          appsScriptUrl: APPS_SCRIPT_DEFAULT,
          files,
        }),
      });
      const json = await readJson<{
        error?: string;
        message?: string;
        count?: number;
      }>(res);
      if (!res.ok) throw new Error(json.error || "Drive upload failed");
      setDriveMsg(
        json.message ||
          `Saved ${json.count} images to Drive folder “${code}”. Meesho sync will pick them up by SKU.`
      );
      setStatus(`Saved to Drive / ${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Drive upload failed");
      setStatus("Upload error");
    } finally {
      setBusy(false);
    }
  }

  const stepLabel = useMemo(() => STEPS[step], [step]);
  const shotTabs = shots.length
    ? shots.map((s, i) => ({
        id: s.id,
        title: `${i + 1} · ${s.title}`,
        blurb: SHOT_META.find((m) => m.id === s.id)?.blurb || s.title,
      }))
    : SHOT_META;

  return (
    <div className="min-h-screen overflow-y-auto bg-[radial-gradient(ellipse_at_top,#fff7ed_0%,#f8fafc_45%,#f1f5f9_100%)]">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
              Listing Image Pack
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">
              5 marketplace shots · 2000×2000 · save to Drive /{"{SKU}"}
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
          {/* Stepper */}
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                  i === step
                    ? "bg-stone-900 text-white"
                    : i < step
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-100 text-stone-500"
                )}
              >
                {i + 1}. {s}
              </li>
            ))}
          </ol>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onFile(e.dataTransfer.files?.[0] || null);
            }}
            className="rounded-2xl border-2 border-dashed border-stone-200 p-4 text-center"
          >
            {source ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={source}
                alt="Upload"
                className="mx-auto max-h-48 rounded-xl object-contain"
              />
            ) : (
              <div className="py-8">
                <ImagePlus className="mx-auto h-8 w-8 text-stone-400" />
                <p className="mt-2 text-sm font-semibold text-stone-800">
                  Drop raw product photo
                </p>
              </div>
            )}
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white">
              Choose image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  void onFile(e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {cutout && (
            <div>
              <p className="mb-1 text-xs font-semibold text-stone-500">Cutout</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cutout}
                alt="Cutout"
                className="mx-auto max-h-36 rounded-xl bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect fill=%22%23eee%22 width=%228%22 height=%228%22/><rect fill=%22%23ddd%22 x=%228%22 width=%228%22 height=%228%22/><rect fill=%22%23ddd%22 y=%228%22 width=%228%22 height=%228%22/><rect fill=%22%23eee%22 x=%228%22 y=%228%22 width=%228%22 height=%228%22/></svg>')] object-contain"
              />
            </div>
          )}

          <label className="block text-xs font-semibold text-stone-600">
            Product SKU <span className="font-normal text-stone-400">(Drive folder name)</span>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. MRPHCCKP1"
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 font-mono text-sm"
            />
          </label>

          <label className="block text-xs font-semibold text-stone-600">
            Product name
            <input
              value={copy.productName}
              onChange={(e) =>
                setCopy((c) => ({ ...c, productName: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="flex gap-2 rounded-xl border border-stone-200 p-1">
            <button
              type="button"
              onClick={() => setPackSize("5")}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold",
                packSize === "5"
                  ? "bg-stone-900 text-white"
                  : "text-stone-600"
              )}
            >
              5 Meesho shots
            </button>
            <button
              type="button"
              onClick={() => setPackSize("8")}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-semibold",
                packSize === "8"
                  ? "bg-stone-900 text-white"
                  : "text-stone-600"
              )}
            >
              8 full pack
            </button>
          </div>

          <label className="block text-xs font-semibold text-stone-600">
            Tagline
            <input
              value={copy.tagline}
              onChange={(e) =>
                setCopy((c) => ({ ...c, tagline: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs font-semibold text-stone-600">
            Gift card text
            <textarea
              value={copy.giftCardText}
              onChange={(e) =>
                setCopy((c) => ({ ...c, giftCardText: e.target.value }))
              }
              rows={2}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-stone-600">
              Height
              <input
                value={copy.dimensions.height}
                onChange={(e) =>
                  setCopy((c) => ({
                    ...c,
                    dimensions: { ...c.dimensions, height: e.target.value },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-stone-200 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-stone-600">
              Width
              <input
                value={copy.dimensions.width}
                onChange={(e) =>
                  setCopy((c) => ({
                    ...c,
                    dimensions: { ...c.dimensions, width: e.target.value },
                  }))
                }
                className="mt-1 w-full rounded-xl border border-stone-200 px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-stone-600">
              Feature titles
            </p>
            {copy.callouts.map((c, i) => (
              <div key={c.id} className="space-y-1">
                <input
                  value={c.label}
                  onChange={(e) => {
                    const next = [...copy.callouts];
                    next[i] = { ...next[i], label: e.target.value };
                    setCopy((p) => ({ ...p, callouts: next }));
                  }}
                  className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs font-semibold"
                  placeholder="Title"
                />
                <input
                  value={c.detail}
                  onChange={(e) => {
                    const next = [...copy.callouts];
                    next[i] = { ...next[i], detail: e.target.value };
                    setCopy((p) => ({ ...p, callouts: next }));
                  }}
                  className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
                  placeholder="Detail"
                />
              </div>
            ))}
          </div>

          <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <input
              type="checkbox"
              checked={forceMock}
              onChange={(e) => setForceMock(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              <strong>Force mock mode</strong> — skip Replicate; instant local
              cutout + plates (best for testing).
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
            disabled={busy || !source}
            onClick={() => void runPipeline()}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {busy ? status : `Generate ${packSize}-image pack`}
          </button>

          {shots.length > 0 && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void recompose()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800"
              >
                <Wand2 className="h-4 w-4" />
                Apply text edits
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveToDrive()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 text-sm font-semibold text-white disabled:opacity-50"
              >
                <CloudUpload className="h-4 w-4" />
                Save to Drive / {sanitizeSku(sku) || "SKU"}
              </button>
              <button
                type="button"
                onClick={() => void downloadZip()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-900 bg-white text-sm font-semibold text-stone-900"
              >
                <Download className="h-4 w-4" />
                Download ZIP
              </button>
            </>
          )}

          {driveMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              {driveMsg}
            </div>
          )}

          <p className="text-center text-[11px] text-stone-500">
            Step: {stepLabel} · Mode: {mode}
          </p>
          <p className="text-center text-[10px] leading-snug text-stone-400">
            Drive layout: parent folder → <strong>SKU</strong> → 5 JPEGs. Meesho sync
            matches that folder name.
          </p>
        </aside>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {shotTabs.map((s, i) => (
              <button
                key={s.id + i}
                type="button"
                disabled={!shots[i]}
                onClick={() => setActiveShot(i)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-40",
                  activeShot === i
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className="flex min-h-[480px] items-center justify-center rounded-2xl bg-stone-100 p-4">
            {shots[activeShot] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shots[activeShot].dataUrl}
                alt={shots[activeShot].title}
                className="max-h-[70vh] w-full max-w-[640px] rounded-xl object-contain shadow-lg"
              />
            ) : (
              <div className="text-center text-sm text-stone-500">
                <p className="font-semibold text-stone-700">No pack yet</p>
                <p className="mt-1 max-w-sm">
                  Enter SKU, upload a clear product photo, generate 5 listing images,
                  then <strong>Save to Drive</strong> into a folder named with that SKU.
                </p>
              </div>
            )}
          </div>

          {shots[activeShot] && (
            <p className="mt-3 text-center text-xs text-stone-500">
              {shotTabs[activeShot]?.blurb} · 2000×2000 JPEG
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
