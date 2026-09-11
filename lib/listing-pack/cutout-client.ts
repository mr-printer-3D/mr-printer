/** Client-side cutout: @imgly/background-removal, with color-key fallback */

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load upload"));
    img.src = src;
  });
}

async function colorKeyCutout(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const max = 1800;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;

  const corners = [
    [2, 2],
    [w - 3, 2],
    [2, h - 3],
    [w - 3, h - 3],
    [w >> 1, 2],
    [2, h >> 1],
  ];
  let br = 0,
    bg = 0,
    bb = 0;
  for (const [x, y] of corners) {
    const i = (y * w + x) * 4;
    br += d[i];
    bg += d[i + 1];
    bb += d[i + 2];
  }
  br /= corners.length;
  bg /= corners.length;
  bb /= corners.length;

  const thresh = 42;
  for (let i = 0; i < d.length; i += 4) {
    const dr = Math.abs(d[i] - br);
    const dg = Math.abs(d[i + 1] - bg);
    const db = Math.abs(d[i + 2] - bb);
    if (dr < thresh && dg < thresh && db < thresh) {
      const dist = (dr + dg + db) / 3;
      d[i + 3] = Math.max(0, Math.min(255, (dist / thresh) * 180));
    }
  }
  // Soft edge pass
  ctx.putImageData(data, 0, 0);
  return c.toDataURL("image/png");
}

export async function localCutout(dataUrl: string): Promise<string> {
  try {
    const { removeBackground } = await import("@imgly/background-removal");
    const blob = await removeBackground(dataUrl, {
      output: { format: "image/png", quality: 0.95 },
    });
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("[cutout] imgly failed, using color-key", err);
    return colorKeyCutout(dataUrl);
  }
}
