import { SIZE } from "./types";

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export function makeCanvas(size = SIZE) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { c, ctx, size };
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string
) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawContain(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  iw: number,
  ih: number,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
) {
  const r = Math.min(w / iw, h / ih) * scale;
  const dw = iw * r;
  const dh = ih * r;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { dw, dh, x: dx, y: dy };
}

/** Soft multi-layer product shadow (ecommerce look) */
export function drawProductShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number
) {
  const layers = [
    { a: 0.22, sx: 1, sy: 1 },
    { a: 0.12, sx: 1.35, sy: 1.4 },
    { a: 0.06, sx: 1.8, sy: 1.9 },
  ];
  for (const L of layers) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * L.sx);
    g.addColorStop(0, `rgba(20,40,70,${L.a})`);
    g.addColorStop(1, "rgba(20,40,70,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * L.sx, ry * L.sy, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Place cutout with soft shadow underneath */
export function placeCutout(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: { rotate?: number; shadow?: boolean; lift?: number }
) {
  const lift = opts?.lift ?? 0;
  ctx.save();
  if (opts?.rotate) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(opts.rotate);
    ctx.translate(-cx, -cy);
  }

  // Measure contain box first for shadow position
  const r = Math.min(w / img.width, h / img.height);
  const dw = img.width * r;
  const dh = img.height * r;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2 - lift;

  if (opts?.shadow !== false) {
    drawProductShadow(
      ctx,
      dx + dw / 2,
      dy + dh * 0.92,
      dw * 0.34,
      Math.max(18, dh * 0.045)
    );
  }

  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  return { dw, dh, x: dx, y: dy };
}

export function toDataUrl(c: HTMLCanvasElement, quality = 0.94) {
  return c.toDataURL("image/jpeg", quality);
}

export function toPng(c: HTMLCanvasElement) {
  return c.toDataURL("image/png");
}
