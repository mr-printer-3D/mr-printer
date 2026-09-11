/** Premium pastel listing design system */

export const C = {
  sky: "#C5E1F5",
  skyMid: "#B3D6F0",
  skyDeep: "#9CC8E8",
  navy: "#1B3358",
  navyMid: "#2A4A6E",
  blue: "#4E9AD4",
  blueSoft: "#6BB0E0",
  pink: "#F5A8BA",
  pinkHot: "#FF7FA0",
  pinkSoft: "#FFE8F0",
  white: "#FFFFFF",
  peach: "#F6D5C8",
  mint: "#E8F6F0",
  leaf: "#6BB87A",
  card: "rgba(255,255,255,0.94)",
  ink: "#1A2332",
};

export const FONT =
  'var(--listing-font), "Nunito", "Segoe UI Rounded", system-ui, sans-serif';
export const FONT_SCRIPT =
  'var(--listing-script), "Pacifico", cursive';

export function roundPath(
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

export function card(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = C.white
) {
  ctx.save();
  ctx.shadowColor = "rgba(27,51,88,0.14)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 12;
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

export function skyStudio(ctx: CanvasRenderingContext2D, size: number) {
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#E8F4FC");
  g.addColorStop(0.45, C.sky);
  g.addColorStop(1, C.skyDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Soft out-of-focus clouds
  const blobs = [
    [0.1, 0.16, 0.2, 0.5],
    [0.75, 0.1, 0.28, 0.42],
    [0.9, 0.5, 0.18, 0.35],
    [0.05, 0.7, 0.22, 0.3],
    [0.5, 0.05, 0.16, 0.4],
  ] as const;
  for (const [px, py, s, a] of blobs) {
    softCloud(ctx, size * px, size * py, size * s, a);
  }
}

function softCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  a: number
) {
  ctx.save();
  ctx.filter = `blur(${Math.max(8, r * 0.12)}px)`;
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.arc(x + r * 0.55, y - r * 0.12, r * 0.7, 0, Math.PI * 2);
  ctx.arc(x + r * 1.15, y, r * 0.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.55, y + r * 0.2, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function pedestal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  rx: number,
  h: number
) {
  // Floor shadow
  const sg = ctx.createRadialGradient(cx, topY + h + 16, 0, cx, topY + h + 16, rx * 1.2);
  sg.addColorStop(0, "rgba(27,51,88,0.2)");
  sg.addColorStop(1, "rgba(27,51,88,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.ellipse(cx, topY + h + 18, rx * 1.15, rx * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cylinder side
  const side = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  side.addColorStop(0, "#E4E8EC");
  side.addColorStop(0.35, "#FFFFFF");
  side.addColorStop(0.65, "#FFFFFF");
  side.addColorStop(1, "#D8DEE6");
  ctx.fillStyle = side;
  ctx.beginPath();
  ctx.moveTo(cx - rx, topY);
  ctx.lineTo(cx - rx * 0.94, topY + h);
  ctx.ellipse(cx, topY + h, rx * 0.94, rx * 0.22, 0, 0, Math.PI, false);
  ctx.lineTo(cx + rx, topY);
  ctx.closePath();
  ctx.fill();

  // Top disc
  const top = ctx.createRadialGradient(cx - rx * 0.2, topY - rx * 0.05, 0, cx, topY, rx);
  top.addColorStop(0, "#FFFFFF");
  top.addColorStop(1, "#EEF2F6");
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(cx, topY, rx, rx * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(27,51,88,0.08)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function heart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color = C.pink
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.28);
  ctx.bezierCurveTo(-s * 0.55, -s * 0.25, -s * 1.05, s * 0.35, 0, s * 1.05);
  ctx.bezierCurveTo(s * 1.05, s * 0.35, s * 0.55, -s * 0.25, 0, s * 0.28);
  ctx.fill();
  ctx.restore();
}

export function sparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color = C.white
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  const rays: [number, number, number, number][] = [
    [0, -32, 0, -10],
    [-24, -20, -8, -8],
    [-28, 4, -10, 2],
    [20, -22, 8, -8],
  ];
  for (const [a, b, c, d] of rays) {
    ctx.beginPath();
    ctx.moveTo(x + a, y + b);
    ctx.lineTo(x + c, y + d);
    ctx.stroke();
  }
  ctx.restore();
}

export function star4(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color = C.pink
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * s * 0.32, Math.sin(a + Math.PI / 4) * s * 0.32);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  align: CanvasTextAlign = "center"
) {
  ctx.textAlign = align;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return lines.length;
}

export type IconId =
  | "heart"
  | "feather"
  | "shield"
  | "cube"
  | "gift"
  | "bag"
  | "backpack"
  | "key"
  | "cloud"
  | "leaf"
  | "ribbon"
  | "hand"
  | "case";

export function icon(
  ctx: CanvasRenderingContext2D,
  kind: IconId,
  x: number,
  y: number,
  s: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3.5, s * 0.09);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (kind) {
    case "heart":
      heart(ctx, 0, -s * 0.2, s * 0.5, color);
      break;
    case "feather":
      ctx.beginPath();
      ctx.moveTo(-s * 0.28, s * 0.32);
      ctx.quadraticCurveTo(s * 0.05, -s * 0.05, s * 0.32, -s * 0.38);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.02 * s, 0.02 * s);
      ctx.lineTo(0.22 * s, -0.12 * s);
      ctx.moveTo(-0.08 * s, 0.14 * s);
      ctx.lineTo(0.16 * s, 0.02 * s);
      ctx.stroke();
      break;
    case "shield":
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42);
      ctx.lineTo(s * 0.34, -s * 0.22);
      ctx.lineTo(s * 0.34, s * 0.08);
      ctx.quadraticCurveTo(0, s * 0.48, -s * 0.34, s * 0.08);
      ctx.lineTo(-s * 0.34, -s * 0.22);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.12, 0);
      ctx.lineTo(-0.02 * s, s * 0.12);
      ctx.lineTo(s * 0.18, -s * 0.12);
      ctx.stroke();
      break;
    case "cube":
      ctx.strokeRect(-s * 0.18, -s * 0.02, s * 0.36, s * 0.36);
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, -s * 0.02);
      ctx.lineTo(0, -s * 0.22);
      ctx.lineTo(s * 0.36, -s * 0.22);
      ctx.lineTo(s * 0.18, -s * 0.02);
      ctx.moveTo(s * 0.18, s * 0.34);
      ctx.lineTo(s * 0.36, s * 0.14);
      ctx.lineTo(s * 0.36, -s * 0.22);
      ctx.stroke();
      break;
    case "gift":
      ctx.strokeRect(-s * 0.28, -s * 0.02, s * 0.56, s * 0.4);
      ctx.strokeRect(-s * 0.32, -s * 0.18, s * 0.64, s * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.18);
      ctx.lineTo(0, s * 0.38);
      ctx.moveTo(-s * 0.32, -0.02 * s);
      ctx.lineTo(s * 0.32, -0.02 * s);
      ctx.stroke();
      break;
    case "bag":
      ctx.beginPath();
      ctx.moveTo(-s * 0.26, -s * 0.02);
      ctx.lineTo(-s * 0.3, s * 0.38);
      ctx.lineTo(s * 0.3, s * 0.38);
      ctx.lineTo(s * 0.26, -s * 0.02);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -s * 0.02, s * 0.16, Math.PI, 0);
      ctx.stroke();
      break;
    case "backpack":
      roundPath(ctx, -s * 0.26, -s * 0.12, s * 0.52, s * 0.5, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -s * 0.12, s * 0.16, Math.PI, 0);
      ctx.stroke();
      break;
    case "key":
      ctx.beginPath();
      ctx.arc(-s * 0.14, 0, s * 0.16, 0, Math.PI * 2);
      ctx.moveTo(0, 0);
      ctx.lineTo(s * 0.36, 0);
      ctx.moveTo(s * 0.22, 0);
      ctx.lineTo(s * 0.22, s * 0.14);
      ctx.moveTo(s * 0.3, 0);
      ctx.lineTo(s * 0.3, s * 0.1);
      ctx.stroke();
      break;
    case "cloud":
      ctx.beginPath();
      ctx.arc(-s * 0.14, 0.04 * s, s * 0.2, 0, Math.PI * 2);
      ctx.arc(s * 0.08, -s * 0.08, s * 0.24, 0, Math.PI * 2);
      ctx.arc(s * 0.26, 0.06 * s, s * 0.16, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "leaf":
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.16, s * 0.32, -0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s * 0.28);
      ctx.lineTo(0, -s * 0.22);
      ctx.stroke();
      break;
    case "ribbon":
      ctx.beginPath();
      ctx.arc(0, -s * 0.08, s * 0.26, 0, Math.PI * 2);
      ctx.stroke();
      star4(ctx, 0, -s * 0.08, s * 0.1, color);
      break;
    case "hand":
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, s * 0.22);
      ctx.lineTo(-s * 0.18, -s * 0.08);
      ctx.lineTo(-s * 0.04, -s * 0.32);
      ctx.lineTo(s * 0.1, -s * 0.12);
      ctx.lineTo(s * 0.22, s * 0.08);
      ctx.lineTo(s * 0.18, s * 0.32);
      ctx.stroke();
      break;
    case "case":
      ctx.strokeRect(-s * 0.32, -s * 0.16, s * 0.64, s * 0.36);
      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.16);
      ctx.lineTo(-s * 0.08, -s * 0.28);
      ctx.lineTo(s * 0.08, -s * 0.28);
      ctx.lineTo(s * 0.08, -s * 0.16);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

export function featureBar(
  ctx: CanvasRenderingContext2D,
  size: number,
  items: { id: IconId; label: string; color?: string }[],
  opts?: {
    y?: number;
    h?: number;
    fill?: string;
    dashed?: boolean;
    divider?: string;
  }
) {
  const y = opts?.y ?? size - 210;
  const h = opts?.h ?? 155;
  const x = 80;
  const w = size - 160;
  card(ctx, x, y, w, h, 40, opts?.fill ?? C.card);

  if (opts?.dashed) {
    ctx.save();
    ctx.strokeStyle = C.blueSoft;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([12, 10]);
    roundPath(ctx, x + 6, y + 6, w - 12, h - 12, 34);
    ctx.stroke();
    ctx.restore();
  }

  const n = items.length;
  const cell = w / n;
  items.forEach((it, i) => {
    const cx = x + cell * i + cell / 2;
    icon(ctx, it.id, cx, y + h * 0.36, 54, it.color ?? C.blue);
    ctx.fillStyle = C.navy;
    ctx.font = `800 26px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrap(ctx, it.label.toUpperCase(), cx, y + h * 0.7, cell - 28, 28);

    if (i < n - 1) {
      ctx.save();
      ctx.strokeStyle = opts?.divider ?? "rgba(78,154,212,0.35)";
      ctx.lineWidth = 2.5;
      if (opts?.dashed) ctx.setLineDash([7, 8]);
      ctx.beginPath();
      ctx.moveTo(x + cell * (i + 1), y + 32);
      ctx.lineTo(x + cell * (i + 1), y + h - 32);
      ctx.stroke();
      ctx.restore();
    }
  });
}

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { title: (name || "YOUR PRODUCT").toUpperCase(), subtitle: "PRODUCT LISTING" };
  }
  if (parts.length === 2) {
    return { title: parts.join(" ").toUpperCase(), subtitle: "BAG CHARM KEYCHAIN" };
  }
  return {
    title: parts.slice(0, 2).join(" ").toUpperCase(),
    subtitle: parts.slice(2).join(" ").toUpperCase(),
  };
}

export function dashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = C.navy
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 14 * Math.cos(ang - 0.4), y2 - 14 * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - 14 * Math.cos(ang + 0.4), y2 - 14 * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
