import { loadImage, makeCanvas, placeCutout, toDataUrl, fillRound } from "./canvas";
import {
  C,
  FONT,
  FONT_SCRIPT,
  skyStudio,
  pedestal,
  heart,
  sparkle,
  star4,
  card,
  icon,
  featureBar,
  wrap,
  splitName,
  dashedLine,
  roundPath,
} from "./style";
import type { ColorVariantId, PackCopy, ShotId } from "./types";
import { SIZE } from "./types";

type VariantMap = Record<ColorVariantId, string>;

async function img(src: string) {
  return loadImage(src);
}

/** Soft solid / gradient studio — graphic, not fake photo */
function wash(ctx: CanvasRenderingContext2D, size: number, a: string, b: string) {
  const g = ctx.createLinearGradient(0, 0, size * 0.2, size);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
}

function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill = C.navy
) {
  ctx.font = `800 22px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const w = tw + 48;
  const h = 44;
  fillRound(ctx, x - w / 2, y, w, h, 22, fill);
  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + h / 2 + 1);
}

/** 1 Hero — pedestal studio */
export async function renderHero(cutout: string, copy: PackCopy) {
  const { c, ctx, size } = makeCanvas(SIZE);
  skyStudio(ctx, size);
  const { title, subtitle } = splitName(copy.productName);

  ctx.textAlign = "center";
  ctx.fillStyle = C.blue;
  ctx.font = `900 108px ${FONT}`;
  ctx.fillText(title, size / 2, 168);
  ctx.fillStyle = C.navy;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(subtitle, size / 2, 228);

  const pedTop = size * 0.7;
  pedestal(ctx, size / 2, pedTop, size * 0.2, size * 0.065);

  const product = await img(cutout);
  placeCutout(ctx, product, size * 0.18, size * 0.24, size * 0.64, size * 0.5, {
    shadow: true,
    lift: 8,
  });

  sparkle(ctx, size * 0.26, size * 0.36, C.white);
  heart(ctx, size * 0.74, size * 0.4, 34, C.pink);
  heart(ctx, size * 0.78, size * 0.48, 20, C.pinkHot);

  featureBar(
    ctx,
    size,
    [
      { id: "heart", label: copy.featureBar[0] || "Cute", color: C.pink },
      { id: "feather", label: copy.featureBar[1] || "Lightweight", color: C.blue },
      { id: "shield", label: copy.featureBar[2] || "Durable", color: C.blue },
      { id: "cube", label: copy.featureBar[3] || "3D Printed", color: C.blue },
    ],
    { y: size - 195, h: 145 }
  );

  return toDataUrl(c, 0.96);
}

/** 2 Color / moments grid — clean product cards */
export async function renderMoments(
  cutout: string,
  variants: VariantMap,
  copy: PackCopy
) {
  const { c, ctx, size } = makeCanvas(SIZE);
  wash(ctx, size, "#EAF5FC", C.sky);

  const base = await img(cutout);
  placeCutout(ctx, base, 40, size * 0.22, size * 0.4, size * 0.52, {
    rotate: -0.06,
  });
  sparkle(ctx, 90, size * 0.28, C.navy);
  heart(ctx, size * 0.36, size * 0.26, 26, C.pink);

  const words = copy.momentsHeadline.toUpperCase().split(" ");
  const last = words.pop() || "MOMENT";
  ctx.textAlign = "center";
  ctx.fillStyle = C.navy;
  ctx.font = `900 58px ${FONT}`;
  ctx.fillText(words.join(" ") || "PERFECT FOR EVERY", size * 0.7, 130);
  ctx.fillStyle = C.pinkHot;
  ctx.font = `900 72px ${FONT}`;
  ctx.fillText(last, size * 0.7, 210);
  ctx.fillStyle = C.navyMid;
  ctx.font = `600 26px ${FONT}`;
  wrap(ctx, copy.tagline, size * 0.7, 255, size * 0.48, 32);

  const tiles: { src: string; label: string; bg: string }[] = [
    { src: variants.base, label: "KEYS", bg: "#F4F7FA" },
    { src: variants.pink, label: "BAG", bg: "#F8EDE4" },
    { src: variants.yellow, label: "BACKPACK", bg: "#E3F0FA" },
    { src: variants.purple, label: "GIFT", bg: "#FFE8F0" },
  ];

  const cell = 420;
  const gap = 28;
  const gx = size * 0.48;
  const gy = size * 0.3;
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gx + col * (cell + gap);
    const y = gy + row * (cell + gap);
    card(ctx, x, y, cell, cell, 32, tiles[i].bg);
    const p = await img(tiles[i].src);
    placeCutout(ctx, p, x + 40, y + 50, cell - 80, cell - 110);
    pill(ctx, tiles[i].label, x + cell / 2, y + 18);
  }

  featureBar(
    ctx,
    size,
    [
      { id: "cloud", label: "Adorable Design", color: C.navy },
      { id: "feather", label: "Lightweight", color: C.navy },
      { id: "shield", label: "Durable", color: C.navy },
      { id: "gift", label: "Perfect Gift", color: C.navy },
    ],
    { y: size - 200, h: 145, dashed: true, divider: C.pink, fill: C.white }
  );

  return toDataUrl(c, 0.94);
}

/** 3 Lifestyle graphic poster */
export async function renderLifestyle(
  cutout: string,
  copy: PackCopy,
  scene?: string
) {
  const { c, ctx, size } = makeCanvas(SIZE);

  if (scene) {
    const bg = await img(scene);
    ctx.drawImage(bg, 0, 0, size, size);
    ctx.fillStyle = "rgba(40,20,30,0.18)";
    ctx.fillRect(0, 0, size, size);
  } else {
    // Premium graphic lifestyle — soft peach studio, not fake leather
    const g = ctx.createRadialGradient(
      size * 0.6,
      size * 0.45,
      40,
      size * 0.5,
      size * 0.5,
      size * 0.8
    );
    g.addColorStop(0, "#F8D0C4");
    g.addColorStop(0.55, "#E8A898");
    g.addColorStop(1, "#C87870");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    // Soft bokeh orbs
    for (const [x, y, r, a] of [
      [0.15, 0.12, 0.12, 0.35],
      [0.85, 0.2, 0.1, 0.25],
      [0.1, 0.75, 0.14, 0.2],
    ] as const) {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(size * x, size * y, size * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(90,140,90,0.28)";
    ctx.beginPath();
    ctx.ellipse(size * 0.12, size * 0.14, 160, 70, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const product = await img(cutout);
  placeCutout(ctx, product, size * 0.32, size * 0.18, size * 0.5, size * 0.55);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = C.white;
  ctx.font = `900 70px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(copy.lifestyleHeadline.toUpperCase(), 70, 150);
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText("FOR YOUR EVERYDAY", 70, 210);
  ctx.restore();
  sparkle(ctx, 60, 110, C.white);
  heart(ctx, 540, 200, 22, C.pink);

  featureBar(
    ctx,
    size,
    [
      { id: "bag", label: "Bags", color: C.navy },
      { id: "backpack", label: "Backpacks", color: C.navy },
      { id: "key", label: "Keys", color: C.navy },
      { id: "case", label: "Pencil Case", color: C.navy },
      { id: "gift", label: "Gifting", color: C.navy },
    ],
    { y: size - 185, h: 135, fill: C.peach }
  );

  return toDataUrl(c, 0.93);
}

/** 4 Features */
export async function renderFeatures(cutout: string, copy: PackCopy) {
  const { c, ctx, size } = makeCanvas(SIZE);
  skyStudio(ctx, size);

  const product = await img(cutout);
  placeCutout(ctx, product, size * 0.02, size * 0.2, size * 0.44, size * 0.58);

  ctx.fillStyle = C.navy;
  ctx.font = `900 88px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("FEATURES", size * 0.5, 150);
  star4(ctx, size * 0.9, 95, 18, C.pink);
  star4(ctx, size * 0.46, 110, 14, C.pink);
  ctx.strokeStyle = C.pink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, 170);
  ctx.quadraticCurveTo(size * 0.68, 195, size * 0.86, 170);
  ctx.stroke();
  heart(ctx, size * 0.68, 185, 16, C.pink);

  const icons = ["cube", "feather", "cloud", "shield", "ribbon"] as const;
  copy.callouts.slice(0, 5).forEach((item, i) => {
    const y = 250 + i * 210;
    const ix = size * 0.54;

    ctx.save();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.arc(ix, y, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(ix, y, 42, 0, Math.PI * 2);
    ctx.fill();
    icon(ctx, icons[i], ix, y, 42, C.blue);
    ctx.restore();

    dashedLine(ctx, ix - 52, y, size * 0.4, size * (0.34 + i * 0.08));

    ctx.fillStyle = C.navy;
    ctx.font = `800 34px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(item.label.toUpperCase(), ix + 78, y - 8);
    ctx.fillStyle = C.navyMid;
    ctx.font = `600 24px ${FONT}`;
    wrap(ctx, item.detail, ix + 78, y + 28, size * 0.36, 30, "left");
  });

  ctx.fillStyle = C.pinkHot;
  ctx.font = `600 34px ${FONT_SCRIPT}`;
  ctx.textAlign = "left";
  ctx.fillText("Carry a little happiness everywhere!", 70, size - 70);
  heart(ctx, 700, size - 85, 18, C.pink);

  return toDataUrl(c, 0.94);
}

/** 5 Quality callouts — crop from YOUR cutout only */
export async function renderQuality(cutout: string, copy: PackCopy) {
  const { c, ctx, size } = makeCanvas(SIZE);
  skyStudio(ctx, size);

  const product = await img(cutout);
  placeCutout(ctx, product, 20, size * 0.16, size * 0.48, size * 0.6, {
    rotate: -0.08,
  });

  ctx.textAlign = "left";
  ctx.fillStyle = C.navy;
  ctx.font = `900 68px ${FONT}`;
  ctx.fillText("QUALITY", size * 0.52, 130);
  ctx.fillStyle = C.pinkHot;
  ctx.fillText("YOU CAN SEE", size * 0.52, 210);
  star4(ctx, size * 0.48, 95, 16, C.pink);
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.52, 240);
  ctx.lineTo(size * 0.7, 240);
  ctx.stroke();
  heart(ctx, size * 0.74, 232, 14, C.pink);
  ctx.beginPath();
  ctx.moveTo(size * 0.78, 240);
  ctx.lineTo(size * 0.94, 240);
  ctx.stroke();

  const zooms = [
    { label: "SMOOTH FINISH", detail: "Clean, precise surface detail" },
    {
      label: "PREMIUM PLA",
      detail: copy.callouts[0]?.detail || "Sturdy, quality filament",
    },
    { label: "UNIQUE TEXTURE", detail: "Layered 3D-print character" },
  ];

  for (let i = 0; i < 3; i++) {
    const cy = 330 + i * 270;
    const cx = size * 0.58;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 88, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#EAF5FC";
    ctx.fillRect(cx - 88, cy - 88, 176, 176);
    const sx = Math.floor((product.width / 4) * (i + 0.5));
    const sy = Math.floor((product.height / 4) * (i + 0.3));
    const sw = Math.floor(product.width / 2.2);
    const sh = Math.floor(product.height / 2.2);
    ctx.drawImage(product, sx, sy, sw, sh, cx - 88, cy - 88, 176, 176);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 7;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, 92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = C.pink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + 100, cy);
    ctx.lineTo(cx + 145, cy);
    ctx.stroke();
    ctx.fillStyle = C.pink;
    ctx.beginPath();
    ctx.arc(cx + 152, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = C.navy;
    ctx.font = `800 30px ${FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(zooms[i].label, cx + 175, cy - 10);
    ctx.fillStyle = "#445566";
    ctx.font = `600 22px ${FONT}`;
    wrap(ctx, zooms[i].detail, cx + 175, cy + 28, size * 0.28, 28, "left");
  }

  featureBar(
    ctx,
    size,
    [
      { id: "shield", label: "Durable", color: C.pink },
      { id: "leaf", label: "Non-Toxic", color: C.leaf },
      { id: "cube", label: "3D Printed", color: C.blue },
      { id: "ribbon", label: "Premium", color: C.pink },
    ],
    { y: size - 195, h: 140 }
  );

  return toDataUrl(c, 0.94);
}

/** 6 Gift poster */
export async function renderGift(
  cutout: string,
  copy: PackCopy,
  scene?: string
) {
  const { c, ctx, size } = makeCanvas(SIZE);

  if (scene) {
    const bg = await img(scene);
    ctx.drawImage(bg, 0, 0, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, 0, size, size);
  } else {
    wash(ctx, size, "#DCEEF8", "#FFE8F0");
    // Soft studio floor
    ctx.fillStyle = "#F7F2EC";
    ctx.fillRect(0, size * 0.58, size, size * 0.42);

    // Gift box prop (simple, graphic)
    card(ctx, size * 0.55, size * 0.5, size * 0.28, size * 0.26, 16, "#F7B6C8");
    ctx.fillStyle = "#FF8FAB";
    ctx.fillRect(size * 0.66, size * 0.5, size * 0.05, size * 0.26);
    ctx.fillRect(size * 0.55, size * 0.6, size * 0.28, size * 0.05);

    card(ctx, size * 0.1, size * 0.62, size * 0.24, size * 0.16, 14, C.white);
    ctx.fillStyle = C.navy;
    ctx.font = `700 24px ${FONT}`;
    ctx.textAlign = "center";
    wrap(ctx, copy.giftCardText, size * 0.22, size * 0.68, size * 0.2, 30);
  }

  const product = await img(cutout);
  placeCutout(ctx, product, size * 0.46, size * 0.26, size * 0.4, size * 0.42);

  const parts = copy.giftHeadline.toUpperCase().split(" ");
  const mid = parts.find((p) => p.length > 5) || parts[2] || "HAPPINESS";
  const midIdx = parts.indexOf(mid);
  const before = parts.slice(0, midIdx).join(" ") || "CARRY A LITTLE";
  const after = parts.slice(midIdx + 1).join(" ") || "EVERYWHERE";

  ctx.textAlign = "left";
  ctx.fillStyle = C.navy;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(before, 70, 130);
  ctx.fillStyle = C.pinkHot;
  ctx.font = `900 84px ${FONT}`;
  ctx.fillText(mid, 70, 230);
  ctx.fillStyle = C.navy;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(after, 70, 300);
  heart(ctx, 70 + ctx.measureText(mid).width + 40, 210, 26, C.pink);
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText(copy.tagline, 70, 360);

  featureBar(
    ctx,
    size,
    [
      { id: "gift", label: "Perfect Gift", color: C.pink },
      { id: "cloud", label: "Spread Joy", color: C.blue },
      { id: "hand", label: "Cute & Light", color: C.pink },
      { id: "bag", label: "Easy Carry", color: C.pink },
    ],
    { y: size - 195, h: 140, divider: C.pink }
  );

  return toDataUrl(c, 0.93);
}

/** 7 How-to grid */
export async function renderHowto(cutout: string, copy: PackCopy) {
  const { c, ctx, size } = makeCanvas(SIZE);
  wash(ctx, size, "#EAF5FC", C.sky);
  heart(ctx, 90, 80, 18, C.pink);
  sparkle(ctx, size - 110, 90, C.pink);

  ctx.fillStyle = C.navy;
  ctx.font = `900 82px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(copy.howtoHeadline.toUpperCase(), size / 2, 125);
  ctx.fillStyle = C.navyMid;
  ctx.font = `600 34px ${FONT_SCRIPT}`;
  ctx.fillText("Simple steps for everyday smiles!", size / 2, 185);

  const product = await img(cutout);
  const steps = [
    { t: "TAKE IT", d: "Unbox your new companion" },
    { t: "ATTACH IT", d: "Clip to keys or zippers" },
    { t: "ENJOY IT", d: "Show it off every day" },
    { t: "TAKE ANYWHERE", d: "Lightweight for travel" },
    { t: "CLEAN IT", d: "Wipe with a soft cloth" },
    { t: "SMILE", d: "A tiny joy that lasts" },
  ];

  const cols = 3;
  const cw = 560;
  const ch = 400;
  const gap = 36;
  const startX = (size - cols * cw - (cols - 1) * gap) / 2;
  const startY = 230;

  for (let i = 0; i < 6; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cw + gap);
    const y = startY + row * (ch + gap);
    card(ctx, x, y, cw, ch, 28, C.white);

    ctx.fillStyle = C.pinkHot;
    ctx.beginPath();
    ctx.arc(x + 44, y + 44, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.font = `800 26px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), x + 44, y + 44);

    ctx.fillStyle = C.navy;
    ctx.font = `800 26px ${FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(steps[i].t, x + 84, y + 54);

    roundPath(ctx, x + 28, y + 84, cw - 56, 210, 18);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = i % 2 === 0 ? "#EAF5FC" : "#F8EDE6";
    ctx.fillRect(x + 28, y + 84, cw - 56, 210);
    placeCutout(ctx, product, x + 70, y + 90, cw - 140, 190);
    ctx.restore();

    ctx.fillStyle = C.navyMid;
    ctx.font = `600 22px ${FONT}`;
    ctx.textAlign = "center";
    wrap(ctx, steps[i].d, x + cw / 2, y + ch - 42, cw - 50, 26);
  }

  featureBar(
    ctx,
    size,
    [
      { id: "shield", label: "Durable", color: C.navy },
      { id: "feather", label: "Lightweight", color: C.navy },
      { id: "hand", label: "Easy Everyday", color: C.navy },
      { id: "cloud", label: "Made to Smile", color: C.navy },
    ],
    { y: size - 175, h: 125, dashed: true, divider: C.pink }
  );

  return toDataUrl(c, 0.94);
}

/** 8 Size guide */
export async function renderDimensions(cutout: string, copy: PackCopy) {
  const { c, ctx, size } = makeCanvas(SIZE);
  wash(ctx, size, "#D8E8F4", "#C5DCEF");

  // Hand silhouette for scale
  ctx.fillStyle = "rgba(230,190,170,0.92)";
  ctx.beginPath();
  ctx.ellipse(size * 0.3, size * 0.6, size * 0.15, size * 0.24, -0.35, 0, Math.PI * 2);
  ctx.fill();
  for (const [ex, ey, rx, ry, rot] of [
    [0.2, 0.46, 0.045, 0.13, 0.45],
    [0.25, 0.4, 0.04, 0.12, 0.15],
    [0.3, 0.38, 0.038, 0.11, 0],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(size * ex, size * ey, size * rx, size * ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = C.navy;
  ctx.font = `900 82px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(copy.sizeHeadline.toUpperCase(), 80, 145);
  heart(ctx, 700, 115, 28, C.pink);
  sparkle(ctx, 70, 95, C.pink);
  ctx.fillStyle = C.ink;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText("Easy to carry everywhere!", 80, 205);

  const product = await img(cutout);
  const placed = placeCutout(
    ctx,
    product,
    size * 0.26,
    size * 0.2,
    size * 0.42,
    size * 0.52
  );

  ctx.strokeStyle = C.navy;
  ctx.fillStyle = C.navy;
  ctx.lineWidth = 5;
  const hx = placed.x + placed.dw + 48;
  dashedLine(ctx, hx, placed.y + 24, hx, placed.y + placed.dh - 24);
  ctx.font = `800 46px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(copy.dimensions.height, hx + 28, placed.y + placed.dh / 2);

  const wy = placed.y + placed.dh + 36;
  dashedLine(ctx, placed.x + 16, wy, placed.x + placed.dw - 16, wy);
  ctx.textAlign = "center";
  ctx.fillText(copy.dimensions.width, placed.x + placed.dw / 2, wy + 58);

  featureBar(
    ctx,
    size,
    [
      { id: "feather", label: "Lightweight", color: C.blue },
      { id: "shield", label: "High Quality", color: C.blue },
      { id: "bag", label: "Easy to Carry", color: C.pink },
    ],
    { y: size - 195, h: 140 }
  );

  return toDataUrl(c, 0.94);
}

export async function renderAllShots(opts: {
  cutout: string;
  variants: VariantMap;
  copy: PackCopy;
  scenes: { lifestyle?: string; packaging?: string; gift?: string };
}) {
  const { cutout, variants, copy, scenes } = opts;

  const shots: { id: ShotId; title: string; dataUrl: string }[] = [
    { id: "hero", title: "Hero", dataUrl: await renderHero(cutout, copy) },
    {
      id: "moments",
      title: "Moments",
      dataUrl: await renderMoments(cutout, variants, copy),
    },
    {
      id: "lifestyle",
      title: "Lifestyle",
      dataUrl: await renderLifestyle(cutout, copy, scenes.lifestyle),
    },
    {
      id: "features",
      title: "Features",
      dataUrl: await renderFeatures(cutout, copy),
    },
    {
      id: "quality",
      title: "Quality",
      dataUrl: await renderQuality(cutout, copy),
    },
    {
      id: "gift",
      title: "Gift",
      dataUrl: await renderGift(cutout, copy, scenes.gift || scenes.packaging),
    },
    {
      id: "howto",
      title: "How to use",
      dataUrl: await renderHowto(cutout, copy),
    },
    {
      id: "dimensions",
      title: "Size",
      dataUrl: await renderDimensions(cutout, copy),
    },
  ];
  return shots;
}

/** 5 high-quality Meesho / marketplace shots (2000×2000, JPEG ~0.96) */
export async function renderMarketplaceShots(opts: {
  cutout: string;
  variants: VariantMap;
  copy: PackCopy;
  scenes: { lifestyle?: string; packaging?: string; gift?: string };
}) {
  const all = await renderAllShots(opts);
  const order: ShotId[] = ["hero", "features", "quality", "gift", "dimensions"];
  const byId = Object.fromEntries(all.map((s) => [s.id, s]));
  return order.map((id) => byId[id]).filter(Boolean);
}
