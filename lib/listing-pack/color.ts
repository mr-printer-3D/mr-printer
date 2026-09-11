import { loadImage, makeCanvas, toPng } from "./canvas";
import type { ColorVariantId } from "./types";

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0,
    g = 0,
    b = 0;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    default:
      r = v;
      g = p;
      b = q;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

const SHIFTS: Record<
  Exclude<ColorVariantId, "base">,
  { h: number; sMul: number; vMul: number }
> = {
  pink: { h: 0.95, sMul: 0.55, vMul: 1.08 },
  yellow: { h: 0.13, sMul: 0.62, vMul: 1.1 },
  purple: { h: 0.78, sMul: 0.5, vMul: 1.05 },
};

/** HSV colorway from a transparent cutout — keeps shading / alpha */
export async function shiftCutoutHue(
  cutoutDataUrl: string,
  variant: ColorVariantId
): Promise<string> {
  if (variant === "base") return cutoutDataUrl;
  const img = await loadImage(cutoutDataUrl);
  const { c, ctx } = makeCanvas(Math.max(img.width, img.height));
  // Fit image onto canvas
  const scale = Math.min(c.width / img.width, c.height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);

  const data = ctx.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  const shift = SHIFTS[variant];

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a < 8) continue;
    const { s, v } = rgbToHsv(d[i], d[i + 1], d[i + 2]);
    // Keep near-neutral pixels (metal rings) mostly untouched
    if (s < 0.12 && v > 0.35) continue;
    const rgb = hsvToRgb(
      shift.h,
      Math.min(1, s * shift.sMul + 0.15),
      Math.min(1, v * shift.vMul)
    );
    d[i] = rgb.r;
    d[i + 1] = rgb.g;
    d[i + 2] = rgb.b;
  }
  ctx.putImageData(data, 0, 0);
  return toPng(c);
}

export async function buildColorVariants(cutoutDataUrl: string) {
  const ids: ColorVariantId[] = ["base", "pink", "yellow", "purple"];
  const out = {} as Record<ColorVariantId, string>;
  for (const id of ids) {
    out[id] = await shiftCutoutHue(cutoutDataUrl, id);
  }
  return out;
}
