import { DEFAULT_DRIVE_FOLDER_ID } from "./types";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  /** Parent SKU folder name when nested */
  skuFolder?: string;
};

function apiKey() {
  return process.env.GOOGLE_API_KEY?.trim() || "";
}

async function listChildren(
  parentId: string,
  key: string,
  mimeFilter: "image" | "folder" | "all"
): Promise<DriveFile[]> {
  const parts = [`'${parentId}' in parents`, "trashed = false"];
  if (mimeFilter === "image") parts.push("mimeType contains 'image/'");
  if (mimeFilter === "folder") {
    parts.push("mimeType = 'application/vnd.google-apps.folder'");
  }
  const q = encodeURIComponent(parts.join(" and "));
  const files: DriveFile[] = [];
  let pageToken = "";
  let pages = 0;

  do {
    pages++;
    let url =
      `https://www.googleapis.com/drive/v3/files?q=${q}` +
      `&fields=nextPageToken,files(id,name,mimeType,webViewLink,webContentLink)` +
      `&pageSize=100&key=${encodeURIComponent(key)}`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Drive API ${res.status}: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      files?: DriveFile[];
      nextPageToken?: string;
    };
    files.push(...(json.files || []));
    pageToken = json.nextPageToken || "";
  } while (pageToken && pages < 20);

  return files;
}

/**
 * List images in Drive folder.
 * Also walks one level of SKU subfolders (folder name = SKU).
 */
export async function listDriveImages(opts?: {
  folderId?: string;
  forceMock?: boolean;
}): Promise<{ mode: "live" | "mock"; files: DriveFile[]; warning?: string }> {
  if (opts?.forceMock || !apiKey()) {
    return {
      mode: "mock",
      files: [],
      warning:
        "Drive mock — set GOOGLE_API_KEY and share folder publicly (viewer).",
    };
  }

  const folderId = opts?.folderId || DEFAULT_DRIVE_FOLDER_ID;
  const key = apiKey();

  try {
    const rootImages = (await listChildren(folderId, key, "image")).map(
      (f) => ({ ...f, skuFolder: undefined })
    );

    const subfolders = await listChildren(folderId, key, "folder");
    const nested: DriveFile[] = [];
    for (const folder of subfolders.slice(0, 80)) {
      try {
        const imgs = await listChildren(folder.id, key, "image");
        for (const img of imgs) {
          nested.push({
            ...img,
            skuFolder: folder.name,
            // Prefer matching via folder name in attachDriveImages
            name: `${folder.name}/${img.name}`,
          });
        }
      } catch {
        /* skip inaccessible subfolder */
      }
    }

    const files = [...rootImages, ...nested];
    return {
      mode: "live",
      files,
      warning:
        files.length === 0
          ? "Drive folder has no images. Create a subfolder named with the product SKU and upload 4–5 photos."
          : undefined,
    };
  } catch (err) {
    return {
      mode: "mock",
      files: [],
      warning: err instanceof Error ? err.message : "Drive fetch failed",
    };
  }
}
