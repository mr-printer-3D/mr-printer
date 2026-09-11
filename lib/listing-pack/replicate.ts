import Replicate from "replicate";

const REMBG =
  process.env.REPLICATE_REMBG_MODEL ||
  "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003";

const SCENE_MODEL =
  process.env.REPLICATE_SCENE_MODEL || "black-forest-labs/flux-schnell";

function client() {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) return null;
  return new Replicate({ auth: token });
}

export function listingPackLiveEnabled() {
  if (process.env.LISTING_PACK_FORCE_MOCK === "1") return false;
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim());
}

function firstUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  return null;
}

async function dataUrlToBuffer(dataUrl: string) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid data URL");
  return Buffer.from(m[2], "base64");
}

async function hostDataUrl(dataUrl: string): Promise<string> {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Invalid image");
  const mime = m[1];
  const bytes = Buffer.from(m[2], "base64");
  const ext = mime.includes("png") ? "png" : "jpg";
  const blob = new Blob([bytes], { type: mime });

  try {
    const form = new FormData();
    form.append("file", blob, `product.${ext}`);
    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30000),
    });
    const json = (await res.json()) as { data?: { url?: string } };
    if (res.ok && json?.data?.url) {
      return json.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    }
  } catch {
    /* fall through */
  }

  const form2 = new FormData();
  form2.append("reqtype", "fileupload");
  form2.append("fileToUpload", blob, `product.${ext}`);
  const res2 = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: form2,
    signal: AbortSignal.timeout(30000),
  });
  const text = (await res2.text()).trim();
  if (res2.ok && /^https?:\/\//i.test(text)) return text;
  throw new Error("Could not host image for Replicate");
}

export async function replicateCutout(dataUrl: string): Promise<string> {
  const replicate = client();
  if (!replicate) throw new Error("NO_TOKEN");

  const imageUrl = await hostDataUrl(dataUrl);
  const output = await replicate.run(REMBG as `${string}/${string}`, {
    input: { image: imageUrl },
  });
  const url = firstUrl(output);
  if (!url) throw new Error("Cutout returned no image");

  // Fetch to data URL for client canvas
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const SCENE_PROMPTS = {
  lifestyle:
    "Photorealistic ecommerce lifestyle background only: soft pink pebbled leather bag zipper in focus, warm morning sunlight, shallow depth of field, green plant bokeh, empty space to hang a small keychain, NO product, NO toy, NO charm, clean composition, 1:1",
  packaging:
    "Photorealistic ecommerce set: open pastel pink gift box with paper crinkle filler on white knit fabric, soft studio light, EMPTY center, NO product, NO toy, premium packaging, 1:1",
  gift: "Photorealistic gift lifestyle set: pink gift box with satin ribbon, small blank greeting card, fairy light bokeh, white knit surface, soft pastels, EMPTY foreground for product, NO charm, NO toy, 1:1",
} as const;

async function urlToDataUrl(url: string) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function replicateScenePlate(
  kind: keyof typeof SCENE_PROMPTS
): Promise<string> {
  const replicate = client();
  if (!replicate) throw new Error("NO_TOKEN");

  const output = await replicate.run(SCENE_MODEL as `${string}/${string}`, {
    input: {
      prompt: SCENE_PROMPTS[kind],
      aspect_ratio: "1:1",
      output_format: "png",
      num_outputs: 1,
      disable_safety_checker: true,
    },
  });
  const url = firstUrl(output);
  if (!url) throw new Error(`Scene ${kind} failed`);
  return urlToDataUrl(url);
}

export async function replicateAllScenes() {
  const kinds = ["lifestyle", "packaging", "gift"] as const;
  const out: Record<string, string> = {};
  for (const k of kinds) {
    try {
      out[k] = await replicateScenePlate(k);
      await new Promise((r) => setTimeout(r, 12_000));
    } catch (err) {
      console.warn("[listing-pack/scene]", k, err);
    }
  }
  return out as {
    lifestyle?: string;
    packaging?: string;
    gift?: string;
  };
}

export { dataUrlToBuffer };
